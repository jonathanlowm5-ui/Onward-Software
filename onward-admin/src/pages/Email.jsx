import { useState } from 'react';
import CampaignModule from '../components/marketing/CampaignModule.jsx';

/*
 * Email Campaign — shares the marketing campaign engine. Adds subject + HTML
 * body with live preview; open/click tracking and the unsubscribe footer are
 * injected automatically at send time. Providers: SendGrid, Mailgun, any SMTP
 * (Amazon SES, Gmail, Mandrill…) or a custom HTTP API.
 */
function EmailFields({ form, setF }) {
  const [preview, setPreview] = useState(false);
  return (
    <>
      <div className="pm-fld" style={{ marginBottom: 12 }}>
        <label>Subject <span className="req-star">*</span></label>
        <input value={form.subject} onChange={(e) => setF('subject', e.target.value)} placeholder="e.g. {{FirstName}}, your weekend bonus is here 🎁" />
      </div>
      <div className="pm-fld" style={{ marginBottom: 6 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          HTML body (optional — plain message below is used when empty)
          <button type="button" className="mini-btn" style={{ marginLeft: 'auto' }} onClick={() => setPreview((p) => !p)}>{preview ? '✏️ Edit' : '👁 Preview'}</button>
        </label>
        {preview ? (
          <iframe
            title="Email preview"
            sandbox=""
            srcDoc={form.html || `<p>${(form.message || '').replace(/\n/g, '<br/>')}</p>`}
            style={{ width: '100%', height: 260, background: '#fff', border: '1px solid var(--border,#243049)', borderRadius: 9 }}
          />
        ) : (
          <textarea
            className="pwa-ta"
            style={{ minHeight: 180, fontFamily: 'monospace', fontSize: '.72rem' }}
            value={form.html}
            onChange={(e) => setF('html', e.target.value)}
            placeholder={'<h1>Hello {{FirstName}}!</h1>\n<p>Your bonus of <b>{{BonusAmount}}</b> is waiting.</p>\n<a href="https://onward-1590a.web.app/promotions">Claim now</a>'}
          />
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
        📈 Open tracking (pixel), click tracking (rewritten links) and the unsubscribe footer are added automatically on send.
      </div>
    </>
  );
}

export default function Email() {
  return (
    <CampaignModule
      channel="email"
      icon="✉️"
      title="Email Campaign"
      sub="Rich HTML campaigns with open/click tracking, unsubscribe handling, audience targeting and provider failover"
      messagePlaceholder="Plain-text fallback: Hi {{FirstName}}, your bonus is waiting…"
      extraFields={(props) => <EmailFields {...props} />}
    />
  );
}
