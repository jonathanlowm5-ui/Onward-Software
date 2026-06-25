import { useEffect, useState } from 'react';
import api from '../../services/api';

/*
 * Emergency announcement ticker — a scrolling marquee shown at the very top of
 * the content area. Driven by GET /api/announcement (admin-controlled). Polls so
 * an emergency notice appears without a reload. Renders nothing when disabled.
 */
const LEVELS = {
  info: { bg: 'linear-gradient(90deg,#0e2740,#10355c)', border: '#2f6fb0', icon: 'ℹ️' },
  warning: { bg: 'linear-gradient(90deg,#3a2a0c,#5a3f10)', border: '#caa23a', icon: '⚠️' },
  critical: { bg: 'linear-gradient(90deg,#3a0e12,#5c1620)', border: '#e8485c', icon: '🚨' },
};

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

  if (!ann || !ann.enabled || !String(ann.text).trim()) return null;
  const lv = LEVELS[ann.level] || LEVELS.info;
  const text = String(ann.text).trim();
  // Repeat the message so the marquee fills wide screens without a big gap.
  const segments = [text, text, text];

  return (
    <div className="note-ticker" style={{ background: lv.bg, borderBottom: `1px solid ${lv.border}` }}>
      <span className="note-ticker-tag" style={{ borderColor: lv.border }}>{lv.icon} Announcement</span>
      <div className="note-ticker-viewport">
        <div className="note-ticker-track">
          {segments.map((s, i) => <span key={i} className="note-ticker-msg">{s}</span>)}
        </div>
      </div>
    </div>
  );
}
