import CampaignModule from '../components/marketing/CampaignModule.jsx';

// SMS Campaign — shares the marketing campaign engine; SMS providers
// (Twilio / Vonage / MessageBird / Infobip / Telnyx / custom HTTP) are
// configured in the Provider Settings card below.
export default function Sms() {
  return (
    <CampaignModule
      channel="sms"
      icon="💬"
      title="SMS Campaign"
      sub="Create, schedule and send SMS blasts with audience targeting, CSV imports and provider failover"
      messagePlaceholder="Hi {{FirstName}}, your bonus of {{BonusAmount}} is waiting! Play now → onward-1590a.web.app"
    />
  );
}
