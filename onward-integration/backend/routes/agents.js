/*
 * routes/agents.js — the Agent / Affiliate module.
 *
 * Completely independent from Player KYC: KYC is only an ELIGIBILITY GATE
 * (a player must have approved KYC + verified email + verified mobile before
 * they can apply). Everything else — applications, documents, workflow,
 * history, commission plans, payouts — lives in its own collections:
 *
 *   agent_applications  the application + workflow (status, docs, banking)
 *   agent_history       audit timeline per application (admin, ip, action)
 *   agents              approved agent profiles (code, plan, stats, balance)
 *   agent_commissions   commission records (CPA / revshare / hybrid, payouts)
 *
 * Workflow statuses:
 *   pending → document_review → under_investigation → need_more_documents
 *           → approved | rejected
 *
 * Player:
 *   GET   /api/agents/eligibility        eligibility checklist
 *   POST  /api/agents/apply              submit application (docs + banking)
 *   GET   /api/agents/me                 my application / agent profile
 *   POST  /api/agents/me/documents       upload extra requested documents
 *   GET   /api/agents/me/downline        referred players
 *   GET   /api/agents/me/commission      my commission records
 * Admin:
 *   GET   /api/agents/dashboard          KPIs + charts
 *   GET   /api/agents/applications       ?status=&q=
 *   GET   /api/agents/applications/:id   full detail + history + player
 *   PATCH /api/agents/applications/:id   change status / remarks / risk / plan
 *   POST  /api/agents/applications/bulk  bulk status change
 *   GET   /api/agents/list               approved agents (+stats)
 *   PATCH /api/agents/agent/:id          suspend / blacklist / plan / manager
 *   GET   /api/agents/agent/:id/players  an agent's referred players
 *   GET/PUT /api/agents/plans            commission plans (CPA/revshare/hybrid)
 *   GET/PUT /api/agents/managers         agent account managers
 *   GET   /api/agents/commissions        ?agentId=&status=
 *   POST  /api/agents/commissions/generate   { period } compute for all agents
 *   POST  /api/agents/commissions/adjust     manual credit/debit
 *   PATCH /api/agents/commissions/:id/pay    mark paid (credits agent balance)
 */
const express = require('express');
const store = require('../store');
const { requireAuth, requirePlayer } = require('../auth');
const { requirePerm, can } = require('../permissions');

const router = express.Router();
const APPS = 'agent_applications';
const HISTORY = 'agent_history';
const AGENTS = 'agents';
const COMMISSIONS = 'agent_commissions';
const PLAYERS = 'players';

const STATUSES = ['pending', 'document_review', 'under_investigation', 'need_more_documents', 'approved', 'rejected'];
const AGENT_STATES = ['active', 'suspended', 'blacklisted'];

/* ------------------------------------------------------------------ utils */
const clientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || '';

function log(appId, req, action, remarks = '') {
  const admin = req.adminUser || store.findUser(req.user && req.user.sub);
  return store.insert(HISTORY, {
    applicationId: String(appId),
    admin: (admin && (admin.username || admin.email)) || req.user?.sub || 'system',
    ip: clientIp(req),
    action,
    remarks,
  });
}

// In-app notification to the player (shows in the notification bell).
function notify(playerId, title, text) {
  if (!playerId) return;
  store.insert('player_messages', {
    playerId: String(playerId), icon: '🧑‍💼', title, text, read: false, source: 'agents',
  });
}

function appForPlayer(playerId) {
  return store.list(APPS).find((a) => String(a.playerId) === String(playerId));
}
function agentForPlayer(playerId) {
  return store.list(AGENTS).find((a) => String(a.playerId) === String(playerId));
}

// Default commission plans (editable via /plans).
const DEFAULT_PLANS = [
  { id: 'cpa-basic', name: 'CPA Basic', type: 'cpa', cpaAmount: 50, minDeposit: 20, revSharePct: 0, active: true },
  { id: 'rev-20', name: 'RevShare 20%', type: 'revshare', cpaAmount: 0, minDeposit: 0, revSharePct: 20, active: true },
  { id: 'hybrid-std', name: 'Hybrid (CPA 25 + 10%)', type: 'hybrid', cpaAmount: 25, minDeposit: 20, revSharePct: 10, active: true },
];
const getPlans = () => {
  const s = store.getSettings();
  return Array.isArray(s.agentPlans) && s.agentPlans.length ? s.agentPlans : DEFAULT_PLANS;
};
const getManagers = () => {
  const s = store.getSettings();
  return Array.isArray(s.agentManagers) ? s.agentManagers : [];
};

function eligibilityFor(player) {
  const kycOk = (player.kyc_status || '') === 'approved';
  const emailOk = !!player.emailVerified;
  const mobileOk = !!player.mobileVerified;
  return {
    kycApproved: kycOk,
    emailVerified: emailOk,
    mobileVerified: mobileOk,
    eligible: kycOk && emailOk && mobileOk,
  };
}

// Referred players for an agent code, with light stats.
function downlineFor(code) {
  if (!code) return [];
  return store.list(PLAYERS)
    .filter((p) => (p.referralCode || p.referral_code || '') === code)
    .map((p) => {
      const txns = store.list('transactions').filter((t) => String(t.playerId) === String(p.id) && t.status === 'approved');
      const deposits = txns.filter((t) => t.type === 'deposit');
      const withdrawals = txns.filter((t) => t.type === 'withdrawal');
      const bets = store.list('bets').filter((b) => String(b.playerId) === String(p.id));
      const wagered = bets.reduce((s, b) => s + Number(b.amount || 0), 0);
      const won = bets.reduce((s, b) => s + Number(b.win || 0), 0);
      return {
        id: p.id, username: p.username, playerCode: p.playerCode,
        currency: p.currency, status: p.status, kyc_status: p.kyc_status,
        registrationDate: p.createdAt, lastLogin: p.lastLogin || '',
        depositCount: deposits.length,
        depositTotal: deposits.reduce((s, t) => s + Number(t.amount || 0), 0),
        withdrawalTotal: withdrawals.reduce((s, t) => s + Number(t.amount || 0), 0),
        wagered, ggr: wagered - won,
      };
    });
}

function agentStats(agent) {
  const dl = downlineFor(agent.code);
  const comms = store.list(COMMISSIONS).filter((c) => String(c.agentId) === String(agent.id));
  return {
    players: dl.length,
    activePlayers: dl.filter((p) => p.depositCount > 0).length,
    depositTotal: dl.reduce((s, p) => s + p.depositTotal, 0),
    ggr: dl.reduce((s, p) => s + p.ggr, 0),
    earned: comms.filter((c) => c.status === 'paid').reduce((s, c) => s + Number(c.amount || 0), 0),
    pending: comms.filter((c) => c.status === 'pending').reduce((s, c) => s + Number(c.amount || 0), 0),
  };
}

/* ============================================================== PLAYER == */

// Eligibility checklist — the player site shows this before the form.
router.get('/eligibility', requirePlayer, (req, res) => {
  const player = store.get(PLAYERS, req.auth.sub);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  res.json(eligibilityFor(player));
});

// Submit an agent application. Blocked unless eligible; one live app per player.
router.post('/apply', requirePlayer, (req, res) => {
  const player = store.get(PLAYERS, req.auth.sub);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const elig = eligibilityFor(player);
  if (!elig.eligible) {
    return res.status(403).json({ error: 'Not eligible — complete KYC, email and mobile verification first', eligibility: elig });
  }

  const existing = appForPlayer(req.auth.sub);
  if (existing && existing.status !== 'rejected') {
    return res.status(409).json({ error: 'You already have an application in progress', application: existing });
  }

  const b = req.body || {};
  if (!b.fullName || !b.phone || !b.email) {
    return res.status(400).json({ error: 'fullName, phone and email are required' });
  }
  if (!b.bankName || !b.bankAccountName || !b.bankAccountNo) {
    return res.status(400).json({ error: 'Banking details (bank, account name, account number) are required' });
  }

  const app = store.insert(APPS, {
    playerId: req.auth.sub,
    username: req.auth.username || player.username,
    playerCode: player.playerCode || '',
    currency: player.currency || '',
    // personal info
    fullName: b.fullName, phone: b.phone, email: b.email,
    dob: b.dob || '', country: b.country || '', address: b.address || '',
    emergencyContact: b.emergencyContact || '',
    // marketing profile
    channels: Array.isArray(b.channels) ? b.channels : [],
    experience: b.experience || '', expectedPlayers: b.expectedPlayers || '',
    notes: b.notes || '',
    // banking
    bankName: b.bankName, bankAccountName: b.bankAccountName,
    bankAccountNo: b.bankAccountNo, bankBranch: b.bankBranch || '',
    // documents (urls from /api/upload)
    documents: Array.isArray(b.documents) ? b.documents : [],
    // workflow
    status: 'pending',
    remarks: '', riskLevel: 'unrated', managerId: '', planId: '',
  });

  store.insert(HISTORY, {
    applicationId: String(app.id), admin: player.username, ip: clientIp(req),
    action: 'Application Submitted', remarks: '',
  });
  res.status(201).json(app);
});

// My application / agent profile — powers the player-side status tracker.
router.get('/me', requirePlayer, (req, res) => {
  const app = appForPlayer(req.auth.sub);
  const agent = agentForPlayer(req.auth.sub);
  if (!app && !agent) return res.status(404).json({ error: 'No application' });
  const history = app
    ? store.list(HISTORY).filter((h) => h.applicationId === String(app.id))
        .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
    : [];
  res.json({
    application: app || null,
    agent: agent ? { ...agent, stats: agentStats(agent) } : null,
    history: history.map(({ ip, ...h }) => h), // don't leak admin IPs to players
  });
});

// Upload extra documents when status = need_more_documents.
router.post('/me/documents', requirePlayer, (req, res) => {
  const app = appForPlayer(req.auth.sub);
  if (!app) return res.status(404).json({ error: 'No application' });
  const docs = Array.isArray(req.body?.documents) ? req.body.documents : [];
  if (!docs.length) return res.status(400).json({ error: 'No documents provided' });
  const merged = [...(app.documents || []), ...docs];
  const nextStatus = app.status === 'need_more_documents' ? 'document_review' : app.status;
  const updated = store.update(APPS, app.id, { documents: merged, status: nextStatus });
  store.insert(HISTORY, {
    applicationId: String(app.id), admin: app.username, ip: clientIp(req),
    action: 'Documents Uploaded', remarks: `${docs.length} document(s) added by applicant`,
  });
  res.json(updated);
});

router.get('/me/downline', requirePlayer, (req, res) => {
  const agent = agentForPlayer(req.auth.sub);
  if (!agent || !agent.code) return res.json([]);
  res.json(downlineFor(agent.code));
});

router.get('/me/commission', requirePlayer, (req, res) => {
  const agent = agentForPlayer(req.auth.sub);
  if (!agent) return res.json([]);
  res.json(store.list(COMMISSIONS).filter((c) => String(c.agentId) === String(agent.id))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
});

/* =============================================================== ADMIN == */

// Dashboard — KPIs + simple time-series for charts.
router.get('/dashboard', requireAuth, requirePerm('agents.manage'), (req, res) => {
  const apps = store.list(APPS);
  const agents = store.list(AGENTS);
  const comms = store.list(COMMISSIONS);

  const byStatus = {};
  STATUSES.forEach((s) => { byStatus[s] = apps.filter((a) => a.status === s).length; });

  // last 30 days: applications + approvals per day
  const days = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const appsPerDay = days.map((day) => apps.filter((a) => (a.createdAt || '').slice(0, 10) === day).length);
  const approvalsPerDay = days.map((day) => agents.filter((a) => (a.approvedAt || '').slice(0, 10) === day).length);

  const withStats = agents.filter((a) => a.status !== 'blacklisted').map((a) => ({ ...a, stats: agentStats(a) }));
  const topAgents = [...withStats].sort((x, y) => y.stats.ggr - x.stats.ggr).slice(0, 5)
    .map((a) => ({ id: a.id, username: a.username, code: a.code, players: a.stats.players, ggr: a.stats.ggr }));

  res.json({
    kpis: {
      totalAgents: agents.length,
      activeAgents: agents.filter((a) => (a.status || 'active') === 'active').length,
      suspended: agents.filter((a) => a.status === 'suspended').length,
      blacklisted: agents.filter((a) => a.status === 'blacklisted').length,
      pendingApplications: apps.filter((a) => !['approved', 'rejected'].includes(a.status)).length,
      referredPlayers: withStats.reduce((s, a) => s + a.stats.players, 0),
      commissionPaid: comms.filter((c) => c.status === 'paid').reduce((s, c) => s + Number(c.amount || 0), 0),
      commissionPending: comms.filter((c) => c.status === 'pending').reduce((s, c) => s + Number(c.amount || 0), 0),
    },
    byStatus,
    charts: { days, appsPerDay, approvalsPerDay },
    topAgents,
  });
});

// Applications list — status filter + free-text search.
router.get('/applications', requireAuth, requirePerm('agents.manage'), (req, res) => {
  let rows = store.list(APPS);
  if (req.query.status) rows = rows.filter((a) => a.status === req.query.status);
  if (req.query.q) {
    const q = String(req.query.q).toLowerCase();
    rows = rows.filter((a) =>
      [a.username, a.fullName, a.email, a.phone, a.playerCode].some((v) => (v || '').toLowerCase().includes(q)));
  }
  rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json(rows);
});

// Application detail — full record + timeline + linked player. Viewing is logged.
router.get('/applications/:id', requireAuth, requirePerm('agents.manage'), (req, res) => {
  const app = store.get(APPS, req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });
  log(app.id, req, 'Admin Viewed');
  const player = app.playerId ? store.get(PLAYERS, app.playerId) : null;
  const history = store.list(HISTORY).filter((h) => h.applicationId === String(app.id))
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  res.json({
    ...app,
    history,
    player: player ? {
      id: player.id, username: player.username, playerCode: player.playerCode,
      email: player.email, phone: player.phone, currency: player.currency,
      kyc_status: player.kyc_status, emailVerified: !!player.emailVerified,
      mobileVerified: !!player.mobileVerified, registrationDate: player.createdAt,
      balance: player.balance, status: player.status,
    } : null,
    eligibility: player ? eligibilityFor(player) : null,
  });
});

// Workflow transition + metadata edit. Approval creates the agent profile.
function applyStatusChange(app, body, req) {
  const patch = {};
  const b = body || {};
  if (b.status !== undefined) {
    if (!STATUSES.includes(b.status)) throw new Error(`Invalid status (${STATUSES.join(', ')})`);
    patch.status = b.status;
  }
  if (b.remarks !== undefined) patch.remarks = String(b.remarks || '');
  if (b.riskLevel !== undefined) patch.riskLevel = String(b.riskLevel || 'unrated');
  if (b.managerId !== undefined) patch.managerId = String(b.managerId || '');
  if (b.planId !== undefined) patch.planId = String(b.planId || '');

  const updated = store.update(APPS, app.id, patch);
  const labels = {
    pending: 'Moved to Pending', document_review: 'Document Review Started',
    under_investigation: 'Under Investigation', need_more_documents: 'More Documents Requested',
    approved: 'Application Approved', rejected: 'Application Rejected',
  };
  if (patch.status && patch.status !== app.status) {
    log(app.id, req, labels[patch.status] || `Status → ${patch.status}`, b.remarks || '');
    const msgs = {
      document_review: ['Agent application update', 'Your documents are now under review.'],
      under_investigation: ['Agent application update', 'Your application is under investigation. We may contact you.'],
      need_more_documents: ['Action needed — agent application', b.remarks || 'Please upload the additional documents requested.'],
      approved: ['🎉 Agent application approved', 'Congratulations! Your agent account is active. Open the Agent page to see your referral code.'],
      rejected: ['Agent application result', b.remarks ? `Unfortunately your application was rejected: ${b.remarks}` : 'Unfortunately your application was rejected.'],
    };
    if (msgs[patch.status]) notify(app.playerId, msgs[patch.status][0], msgs[patch.status][1]);
  } else if (Object.keys(patch).length) {
    log(app.id, req, 'Application Updated', Object.keys(patch).join(', '));
  }

  // Approval → create/reactivate the agent profile + promote the player.
  if (patch.status === 'approved') {
    let agent = agentForPlayer(app.playerId);
    const code = (agent && agent.code) || `AG${String(app.playerId).replace(/\D/g, '').slice(-4).padStart(4, '0')}${String(app.id).slice(-2).toUpperCase()}`;
    const base = {
      playerId: app.playerId, username: app.username, applicationId: String(app.id),
      code, status: 'active', planId: patch.planId || app.planId || getPlans()[0]?.id || '',
      managerId: patch.managerId || app.managerId || '', riskLevel: patch.riskLevel || app.riskLevel || 'unrated',
      currency: app.currency || '', balance: agent ? agent.balance : 0,
      approvedAt: new Date().toISOString(),
    };
    agent = agent ? store.update(AGENTS, agent.id, base) : store.insert(AGENTS, base);
    if (app.playerId && store.get(PLAYERS, app.playerId)) store.update(PLAYERS, app.playerId, { role: 'agent' });
  }
  return updated;
}

router.patch('/applications/:id', requireAuth, requirePerm('agents.approve'), (req, res) => {
  const app = store.get(APPS, req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });
  try { res.json(applyStatusChange(app, req.body, req)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// Bulk workflow change (CRM-style multi-select).
router.post('/applications/bulk', requireAuth, requirePerm('agents.approve'), (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  if (!ids.length) return res.status(400).json({ error: 'ids[] required' });
  const results = [];
  for (const id of ids) {
    const app = store.get(APPS, id);
    if (!app) { results.push({ id, error: 'not found' }); continue; }
    try { results.push({ id, ok: true, application: applyStatusChange(app, req.body, req) }); }
    catch (e) { results.push({ id, error: e.message }); }
  }
  res.json({ results });
});

// Approved agents (the Agent List page) with live stats.
router.get('/list', requireAuth, requirePerm('agents.manage'), (req, res) => {
  let rows = store.list(AGENTS);
  if (req.query.status) rows = rows.filter((a) => (a.status || 'active') === req.query.status);
  rows.sort((a, b) => (b.approvedAt || b.createdAt || '').localeCompare(a.approvedAt || a.createdAt || ''));
  res.json(rows.map((a) => ({ ...a, stats: agentStats(a) })));
});

// Manage an agent — suspend / blacklist / reactivate, change plan/manager/risk.
router.patch('/agent/:id', requireAuth, requirePerm('agents.manage'), (req, res) => {
  const agent = store.get(AGENTS, req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  const b = req.body || {};
  const patch = {};
  if (b.status !== undefined) {
    if (!AGENT_STATES.includes(b.status)) return res.status(400).json({ error: `Invalid status (${AGENT_STATES.join(', ')})` });
    if (b.status === 'blacklisted' && !can(req.adminUser, 'agents.blacklist')) {
      return res.status(403).json({ error: 'Permission denied (agents.blacklist). Ask a superadmin.' });
    }
    patch.status = b.status;
  }
  if (b.planId !== undefined) patch.planId = String(b.planId || '');
  if (b.managerId !== undefined) patch.managerId = String(b.managerId || '');
  if (b.riskLevel !== undefined) patch.riskLevel = String(b.riskLevel || 'unrated');
  const updated = store.update(AGENTS, agent.id, patch);
  if (agent.applicationId) {
    log(agent.applicationId, req,
      patch.status ? `Agent ${patch.status === 'active' ? 'Reactivated' : patch.status === 'suspended' ? 'Suspended' : 'Blacklisted'}` : 'Agent Updated',
      b.remarks || '');
  }
  if (patch.status === 'suspended') notify(agent.playerId, 'Agent account suspended', b.remarks || 'Your agent account has been suspended. Contact support.');
  if (patch.status === 'active' && agent.status !== 'active') notify(agent.playerId, 'Agent account reactivated', 'Your agent account is active again.');
  res.json(updated);
});

// An agent's referred players (filterable).
router.get('/agent/:id/players', requireAuth, requirePerm('agents.manage'), (req, res) => {
  const agent = store.get(AGENTS, req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  let rows = downlineFor(agent.code);
  if (req.query.q) {
    const q = String(req.query.q).toLowerCase();
    rows = rows.filter((p) => [p.username, p.playerCode].some((v) => (v || '').toLowerCase().includes(q)));
  }
  if (req.query.active === '1') rows = rows.filter((p) => p.depositCount > 0);
  res.json({ agent: { id: agent.id, username: agent.username, code: agent.code }, players: rows });
});

/* ---------------- plans & managers (settings-backed) ---------------- */
router.get('/plans', requireAuth, (req, res) => res.json(getPlans()));
router.put('/plans', requireAuth, requirePerm('agents.commission'), (req, res) => {
  const plans = Array.isArray(req.body?.plans) ? req.body.plans : [];
  store.saveSettings({ agentPlans: plans });
  res.json(plans);
});

router.get('/managers', requireAuth, (req, res) => res.json(getManagers()));
router.put('/managers', requireAuth, requirePerm('agents.manage'), (req, res) => {
  const managers = Array.isArray(req.body?.managers) ? req.body.managers : [];
  store.saveSettings({ agentManagers: managers });
  res.json(managers);
});

/* ------------------------- commissions ------------------------- */
router.get('/commissions', requireAuth, requirePerm('agents.commission'), (req, res) => {
  let rows = store.list(COMMISSIONS);
  if (req.query.agentId) rows = rows.filter((c) => String(c.agentId) === String(req.query.agentId));
  if (req.query.status) rows = rows.filter((c) => c.status === req.query.status);
  rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json(rows);
});

// Compute commissions for all active agents for a period (YYYY-MM).
// Idempotent: one record per agent+period+kind.
router.post('/commissions/generate', requireAuth, requirePerm('agents.commission'), (req, res) => {
  const period = String(req.body?.period || '').slice(0, 7) || new Date().toISOString().slice(0, 7);
  const plans = getPlans();
  const existing = store.list(COMMISSIONS);
  const created = [];

  for (const agent of store.list(AGENTS).filter((a) => (a.status || 'active') === 'active')) {
    const plan = plans.find((p) => p.id === agent.planId) || plans[0];
    if (!plan) continue;
    const dl = downlineFor(agent.code);

    // CPA: per referred player whose FIRST deposit ≥ minDeposit happened in the period.
    if ((plan.type === 'cpa' || plan.type === 'hybrid') && Number(plan.cpaAmount) > 0) {
      const kind = 'cpa';
      if (!existing.some((c) => String(c.agentId) === String(agent.id) && c.period === period && c.kind === kind)) {
        let qualified = 0;
        for (const p of dl) {
          const deps = store.list('transactions')
            .filter((t) => String(t.playerId) === String(p.id) && t.type === 'deposit' && t.status === 'approved')
            .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
          const first = deps[0];
          if (first && (first.createdAt || '').slice(0, 7) === period && Number(first.amount || 0) >= Number(plan.minDeposit || 0)) qualified++;
        }
        if (qualified > 0) {
          created.push(store.insert(COMMISSIONS, {
            agentId: String(agent.id), agentUsername: agent.username, period, kind,
            planId: plan.id, detail: `${qualified} qualified first-time depositor(s) × ${plan.cpaAmount}`,
            amount: qualified * Number(plan.cpaAmount), currency: agent.currency || '', status: 'pending',
          }));
        }
      }
    }

    // RevShare: % of the period's GGR from the downline.
    if ((plan.type === 'revshare' || plan.type === 'hybrid') && Number(plan.revSharePct) > 0) {
      const kind = 'revshare';
      if (!existing.some((c) => String(c.agentId) === String(agent.id) && c.period === period && c.kind === kind)) {
        let ggr = 0;
        for (const p of dl) {
          const bets = store.list('bets').filter((b) => String(b.playerId) === String(p.id) && (b.createdAt || '').slice(0, 7) === period);
          ggr += bets.reduce((s, b) => s + Number(b.amount || 0) - Number(b.win || 0), 0);
        }
        if (ggr > 0) {
          created.push(store.insert(COMMISSIONS, {
            agentId: String(agent.id), agentUsername: agent.username, period, kind,
            planId: plan.id, detail: `${plan.revSharePct}% of ${ggr.toFixed(2)} GGR`,
            amount: Math.round(ggr * Number(plan.revSharePct)) / 100, currency: agent.currency || '', status: 'pending',
          }));
        }
      }
    }
  }
  res.json({ period, created: created.length, records: created });
});

// Manual adjustment (bonus / correction).
router.post('/commissions/adjust', requireAuth, requirePerm('agents.commission'), (req, res) => {
  const b = req.body || {};
  const agent = store.get(AGENTS, b.agentId);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  const amount = Number(b.amount || 0);
  if (!amount) return res.status(400).json({ error: 'amount required (can be negative)' });
  const rec = store.insert(COMMISSIONS, {
    agentId: String(agent.id), agentUsername: agent.username,
    period: new Date().toISOString().slice(0, 7), kind: 'adjustment',
    planId: '', detail: b.detail || 'Manual adjustment',
    amount, currency: agent.currency || '', status: 'pending',
  });
  res.json(rec);
});

// Mark a commission paid → credits the agent's player balance as a bonus txn.
router.patch('/commissions/:id/pay', requireAuth, requirePerm('agents.commission'), (req, res) => {
  const c = store.get(COMMISSIONS, req.params.id);
  if (!c) return res.status(404).json({ error: 'Commission not found' });
  if (c.status === 'paid') return res.status(409).json({ error: 'Already paid' });
  const agent = store.get(AGENTS, c.agentId);
  const updated = store.update(COMMISSIONS, c.id, { status: 'paid', paidAt: new Date().toISOString() });
  if (agent) {
    store.update(AGENTS, agent.id, { balance: Number(agent.balance || 0) + Number(c.amount || 0) });
    const player = agent.playerId ? store.get(PLAYERS, agent.playerId) : null;
    if (player && Number(c.amount) > 0) {
      store.update(PLAYERS, player.id, { balance: Number(player.balance || 0) + Number(c.amount) });
      store.insert('transactions', {
        playerId: player.id, username: player.username, currency: player.currency || '',
        type: 'bonus', amount: Number(c.amount), method: 'commission', source: 'agent-commission',
        status: 'approved', note: `Agent commission ${c.period} (${c.kind})`,
      });
      notify(player.id, '💰 Commission paid', `Your ${c.period} ${c.kind} commission of ${c.amount} ${c.currency || ''} has been credited.`);
    }
  }
  res.json(updated);
});

module.exports = router;
