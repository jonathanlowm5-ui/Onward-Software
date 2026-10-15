import { useEffect, useState } from 'react';
import api from '../../services/api';

/*
 * Emergency announcement ticker — a scrolling marquee shown at the very top of
 * the content area. Driven by GET /api/announcement (admin-controlled). Supports
 * multiple messages (the legacy single message plus a `tickers` list) which all
 * scroll together, separated by a divider. Polls so a notice appears without a
 * reload. Renders nothing when there is nothing enabled.
 */
const LEVELS = {
  info: { bg: 'linear-gradient(90deg,#0e2740,#10355c)', border: '#2f6fb0', icon: 'ℹ️' },
  warning: { bg: 'linear-gradient(90deg,#3a2a0c,#5a3f10)', border: '#caa23a', icon: '⚠️' },
  critical: { bg: 'linear-gradient(90deg,#3a0e12,#5c1620)', border: '#e8485c', icon: '🚨' },
};
const SEVERITY = { info: 0, warning: 1, critical: 2 };

export default function NotificationTicker() {
  const [ann, setAnn] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = () => api.get('/announcement')
      .then((r) => { if (alive) setAnn(r.data); })
      .catch(() => {});
    load();
    const id = setInterval(load, 60000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!ann) return null;

  // Gather every enabled message: the legacy single one + the tickers list.
  const messages = [];
  if (ann.enabled && String(ann.text).trim()) {
    messages.push({ text: String(ann.text).trim(), level: ann.level || 'info' });
  }
  if (Array.isArray(ann.tickers)) {
    ann.tickers.forEach((t) => {
      if (t && t.enabled !== false && String(t.text).trim()) {
        messages.push({ text: String(t.text).trim(), level: t.level || 'info' });
      }
    });
  }
  if (!messages.length) return null;

  // The bar colour follows the most severe message on screen.
  const worst = messages.reduce((m, x) => (SEVERITY[x.level] > SEVERITY[m] ? x.level : m), 'info');
  const lv = LEVELS[worst] || LEVELS.info;

  // One scrolling "run" = every message once. Repeat the run so the marquee
  // fills wide screens without a gap.
  const run = messages.map((m) => `${LEVELS[m.level]?.icon || ''} ${m.text}`.trim());
  const segments = [...run, ...run, ...run];

  return (
    <div className="note-ticker" style={{ background: lv.bg, borderBottom: `1px solid ${lv.border}` }}>
      <span className="note-ticker-tag" style={{ borderColor: lv.border }}>{lv.icon} Announcement</span>
      <div className="note-ticker-viewport">
        <div className="note-ticker-track">
          {segments.map((s, i) => (
            <span key={i} className="note-ticker-msg">
              {s}
              <span className="note-ticker-sep">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
