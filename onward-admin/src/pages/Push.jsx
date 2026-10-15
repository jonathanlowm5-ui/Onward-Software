import CampaignModule from '../components/marketing/CampaignModule.jsx';

/*
 * Push Notification — shares the marketing campaign engine. The built-in
 * "In-app" provider (no credentials) delivers to the player's notification
 * bell; FCM / OneSignal providers reach web & mobile push subscribers.
 */
function PushFields({ form, setF }) {
  return (
    <>
      <div className="pm-grid" style={{ marginBottom: 12 }}>
        <div className="pm-fld"><label>Title <span className="req-star">*</span></label><input value={form.subject} onChange={(e) => setF('subject', e.target.value)} placeholder="e.g. 🎁 Weekend bonus live!" /></div>
        <div className="pm-fld"><label>Deep link (opens on tap)</label><input value={form.link} onChange={(e) => setF('link', e.target.value)} placeholder="/promotions or https://…" /></div>
      </div>
      <div className="pm-fld" style={{ marginBottom: 12 }}>
        <label>Image URL (optional — rich notification)</label>
        <input value={form.image} onChange={(e) => setF('image', e.target.value)} placeholder="https://…/banner.jpg" />
      </div>
    </>
  );
}

export default function Push() {
  return (
    <CampaignModule
      channel="push"
      icon="🔔"
      title="Push Notification"
      sub="Instant or scheduled notifications — in-app bell (built-in), Firebase Cloud Messaging and OneSignal for web/Android/iOS"
      messagePlaceholder="Body: Hi {{FirstName}}, 50 free spins just dropped — tap to claim!"
      extraFields={(props) => <PushFields {...props} />}
    />
  );
}
