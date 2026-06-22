import { useState } from 'react';
import { useUI } from '../context/UIContext';

const INITIAL_APK = [
  { t: '🎁 Bonus Waiting!', m: 'Your daily cashback is ready to claim', tg: 'All APK Users', at: 'Today 12:00', ctr: '12.8%', st: 'sent' },
  { t: '⚡ Jackpot Alert!', m: 'Someone just won ₱4.2M on Gates of Olympus', tg: 'Active APK', at: 'Today 14:30', ctr: '15.6%', st: 'sent' },
  { t: '🏆 New Tournament', m: 'Pixel Rush starts in 1 hour — ₱100K prize pool', tg: 'APK Players', at: 'Scheduled', ctr: '—', st: 'sched' },
];
const INITIAL_PWA = [
  { t: '💰 Weekend Reload', m: 'Top up now and get 50% extra', tg: 'All Subscribers', at: 'Today 10:00', ctr: '7.4%', st: 'sent' },
  { t: '🔥 Hot Game', m: 'Try the new Pixel Rush slot — 96.5% RTP', tg: 'Desktop Users', at: 'Scheduled', ctr: '—', st: 'sched' },
];

function PushTable({ arr, onCancel }) {
  const { toast } = useUI();
  return (
    <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 920 }}>
      <thead><tr><th>Title</th><th>Message</th><th>Target</th><th>Sent</th><th>CTR</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>{arr.map((c, i) => (
        <tr key={i}>
          <td><b>{c.t}</b></td><td className="msg-muted">{c.m}</td><td>{c.tg}</td><td>{c.at}</td>
          <td style={{ color: c.ctr === '—' ? 'var(--muted)' : 'var(--gold)', fontWeight: 800 }}>{c.ctr}</td>
          <td>{c.st === 'sent' ? <span className="sms-sent">Sent</span> : <span className="sms-sched">Scheduled</span>}</td>
          <td>{c.st === 'sent'
            ? <button className="mini-btn" onClick={() => toast(`Push report: ${c.t.replace(/'/g, '')} — ${c.ctr} CTR`)}>View</button>
            : <>
              <button className="mini-btn" onClick={() => toast('Edit push — demo')}>Edit</button>{' '}
              <button className="btn-cancel-red" onClick={() => onCancel(i)}>Cancel</button>
            </>}
          </td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}

export default function Push() {
  const { toast } = useUI();
  const [tab, setTab] = useState('apk');
  const [apk, setApk] = useState(INITIAL_APK);
  const [pwa, setPwa] = useState(INITIAL_PWA);

  const cancelApk = (idx) => { setApk((prev) => prev.filter((_, i) => i !== idx)); toast('Scheduled push cancelled'); };
  const cancelPwa = (idx) => { setPwa((prev) => prev.filter((_, i) => i !== idx)); toast('Scheduled push cancelled'); };

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">🔔 Push Notification</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Send push notifications via Firebase (APK app) and Web Push (PWA)</div></div>
        <span className="pr"><button className="btn-search" onClick={() => toast('New Push — demo')}>＋ New Push</button></span>
      </div>
      <div className="utabs">
        <button className={`utab ${tab === 'apk' ? 'active' : ''}`} onClick={() => setTab('apk')}>📱 APK / Firebase</button>
        <button className={`utab ${tab === 'pwa' ? 'active' : ''}`} onClick={() => setTab('pwa')}>🌐 PWA Push</button>
      </div>
      {tab === 'apk' ? (
        <>
          <div className="push-hint">📱<span>Delivered to installed <b className="or">Android APK</b> users through <b className="gold">Firebase Cloud Messaging (FCM)</b>.</span></div>
          <div className="grid kpi-grid">
            <div className="card kpi b"><div className="lbl">FCM Devices</div><div className="val">18,204</div></div>
            <div className="card kpi g"><div className="lbl">Sent Today</div><div className="val">{apk.filter((x) => x.st === 'sent').length}</div></div>
            <div className="card kpi"><div className="lbl">Avg CTR</div><div className="val">11.2%</div></div>
            <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Uninstall Rate</div><div className="val">1.4%</div></div>
          </div>
          <div className="card" style={{ marginTop: 'var(--pad)' }}><div className="card-title">📱 Firebase Push (APK)</div><PushTable arr={apk} onCancel={cancelApk} /></div>
        </>
      ) : (
        <>
          <div className="push-hint">🌐<span>Delivered to <b className="bl">PWA / browser</b> users who opted in to <b className="bl">Web Push</b> notifications.</span></div>
          <div className="grid kpi-grid">
            <div className="card kpi b"><div className="lbl">Web Subscribers</div><div className="val">6,608</div></div>
            <div className="card kpi g"><div className="lbl">Sent Today</div><div className="val">{pwa.filter((x) => x.st === 'sent').length}</div></div>
            <div className="card kpi"><div className="lbl">Avg CTR</div><div className="val">6.9%</div></div>
            <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Opt-Out Rate</div><div className="val">2.8%</div></div>
          </div>
          <div className="card" style={{ marginTop: 'var(--pad)' }}><div className="card-title">🌐 Web Push (PWA)</div><PushTable arr={pwa} onCancel={cancelPwa} /></div>
        </>
      )}
    </>
  );
}
