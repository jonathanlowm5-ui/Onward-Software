import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import api from '../services/api';

/*
 * Page Links — the footer support pages (Help Center, Terms, Privacy,
 * Responsible Gaming, Contact Us) shown at /support/:key on the player site,
 * plus the Live Chat URL. Content is plain text; blank lines make paragraphs.
 */
const PAGES = [
  ['help', '❓', 'Help Center'],
  ['terms', '📜', 'Terms and Conditions'],
  ['privacy', '🔒', 'Privacy Policy'],
  ['responsible', '🛡️', 'Responsible Gaming'],
  ['contact', '✉️', 'Contact Us'],
];

export default function PageLinks() {
  const { toast } = useUI();
  const [pages, setPages] = useState(null);
  const [liveChatUrl, setLiveChatUrl] = useState('');
  const [tab, setTab] = useState('help');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/support-pages')
      .then((r) => { setPages(r.data.pages || {}); setLiveChatUrl(r.data.liveChatUrl || ''); })
      .catch(() => setPages({}));
  }, []);

  const setField = (key, field, value) =>
    setPages((p) => ({ ...p, [key]: { ...(p[key] || {}), [field]: value } }));

  const save = async () => {
    if (liveChatUrl && !/^https?:\/\//i.test(liveChatUrl)) {
      toast('⚠ Live Chat URL must start with http:// or https://');
      return;
    }
    setSaving(true);
    try {
      const r = await api.put('/support-pages', { pages, liveChatUrl });
      setPages(r.data.pages);
      toast('Support pages saved ✅ — live on the player site');
    } catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
    finally { setSaving(false); }
  };

  const page = pages?.[tab] || { title: '', content: '' };

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">🔗 Page Links</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Edit the footer support pages (Help Center, Terms, Privacy, Responsible Gaming, Contact) and the Live Chat link</div></div>
        <span className="pr"><button className="btn-search" onClick={save} disabled={saving || !pages}>{saving ? 'Saving…' : '💾 Save all'}</button></span>
      </div>

      <div className="card" style={{ marginBottom: 'var(--pad)' }}>
        <div className="card-title">💬 Live Chat link</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Where the footer “Live Chat” opens (e.g. your tawk.to / Telegram / WhatsApp link). Leave blank to send players to the Contact page instead.</div>
        <input className="qsearch" style={{ width: '100%', maxWidth: 520 }} placeholder="https://tawk.to/chat/… or https://t.me/OnwardSupport" value={liveChatUrl} onChange={(e) => setLiveChatUrl(e.target.value)} />
      </div>

      <div className="card">
        <div className="pilltabs" style={{ marginBottom: 14 }}>
          {PAGES.map(([k, ic, label]) => (
            <button key={k} className={`pill ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{ic} {label}</button>
          ))}
        </div>
        {!pages ? (
          <div className="hist-empty">Loading…</div>
        ) : (
          <>
            <div className="pm-fld" style={{ marginBottom: 12, maxWidth: 520 }}>
              <label>Page title</label>
              <input value={page.title || ''} onChange={(e) => setField(tab, 'title', e.target.value)} />
            </div>
            <div className="pm-fld">
              <label>Content ({(page.content || '').length.toLocaleString()} characters — blank lines make paragraphs)</label>
              <textarea
                className="pwa-ta"
                style={{ minHeight: 420, fontSize: 13, lineHeight: 1.6 }}
                value={page.content || ''}
                onChange={(e) => setField(tab, 'content', e.target.value)}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
