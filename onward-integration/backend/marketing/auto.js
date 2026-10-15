/*
 * marketing/auto.js — campaign automation triggers.
 *
 * Other routes call `trigger('registration', player)` etc.; each enabled
 * automation matching that trigger enqueues a marketing job (with optional
 * delay) which the engine's tick processes and sends through the channel's
 * active provider. Fire-and-forget: a marketing failure never breaks the
 * business action that triggered it.
 */
const store = require('../store');

const TRIGGERS = ['registration', 'first_deposit', 'kyc_approved', 'vip_upgrade', 'inactive_30d', 'birthday', 'failed_deposit'];

const list = () => {
  const s = store.getSettings();
  return Array.isArray(s.marketingAutomations) ? s.marketingAutomations : [];
};

function trigger(event, player, extra = {}) {
  try {
    if (!player || !player.id) return;
    list()
      .filter((a) => a.enabled !== false && a.trigger === event)
      .forEach((a) => {
        store.insert('marketing_jobs', {
          automationId: a.id,
          trigger: event,
          playerId: player.id,
          username: player.username || '',
          extra,
          status: 'queued',
          dueAt: new Date(Date.now() + (Number(a.delayMinutes) || 0) * 60000).toISOString(),
        });
      });
  } catch (e) {
    console.error('[marketing] trigger failed:', e.message);
  }
}

module.exports = { trigger, TRIGGERS, listAutomations: list };
