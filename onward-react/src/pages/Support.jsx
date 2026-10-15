import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

/*
 * Support content pages (/support/:key) — Help Center, Terms and Conditions,
 * Privacy Policy, Responsible Gaming, Contact Us. The content is fully
 * admin-editable via /api/support-pages (CMS → Page Links).
 */
const TABS = [
  ['help', '❓', 'Help Center'],
  ['terms', '📜', 'Terms'],
  ['privacy', '🔒', 'Privacy'],
  ['responsible', '🛡️', 'Responsible Gaming'],
  ['contact', '✉️', 'Contact Us'],
];

// Module cache so switching tabs doesn't refetch.
let cached = null;

export default function Support() {
  const { key } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(cached);
  const active = TABS.some(([k]) => k === key) ? key : 'help';

  useEffect(() => {
    if (cached) return;
    api.get('/support-pages')
      .then((r) => { cached = r.data; setData(r.data); })
      .catch(() => {});
  }, []);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [active]);

  const page = data?.pages?.[active];

  return (
    <div id="view-support">
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 60px' }}>
        <div className="seg-tabs" style={{ marginBottom: 20 }}>
          {TABS.map(([k, icon, label]) => (
            <button key={k} className={active === k ? 'active' : ''} onClick={() => navigate(`/support/${k}`)}>
              <span aria-hidden="true">{icon}</span> {label}
            </button>
          ))}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 26px' }}>
          {!page ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Loading…</div>
          ) : (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', marginBottom: 18 }}>{page.title}</h1>
              <div style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,.72)', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                {page.content}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
