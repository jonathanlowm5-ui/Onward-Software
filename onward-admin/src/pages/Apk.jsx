import { useState } from 'react';
import { useUI } from '../context/UIContext';

const IOS_ROWS = [
  { ver: '測試-law', pkg: 'law', force: 'no', url: 'law.com', sig: '3', content: '1', chg: '2026-05-07 10:37:34', cr: '2026-05-07 10:37:34', active: false },
  { ver: '2.2.0332', pkg: 'abc', force: 'no', url: '', sig: '', content: '', chg: '2026-01-23 08:57:28', cr: '2026-01-23 08:57:28', active: true },
  { ver: '2.2.0334', pkg: '8', force: 'no', url: 'https://apps.apple.com/cn/app/id4480091', sig: 'https://8bx.bmajimxr.top/promo', content: '', chg: '2026-07-16 17:13:36', cr: '2025-12-16 16:47:08', active: false },
  { ver: '2.2.0333', pkg: '', force: 'no', url: '', sig: '', content: '', chg: '2026-11-16 13:33:19', cr: '2026-11-16 13:33:19', active: false },
  { ver: '2.2.0707', pkg: '1111', force: 'no', url: 'https://global58.xyz?key=nv4VyU', sig: '', content: '', chg: '2026-07-11 16:08:49', cr: '2026-07-11 15:06:38', active: false },
  { ver: '1', pkg: '2', force: 'no', url: '', sig: '6', content: '1', chg: '2026-06-24 09:58:19', cr: '2026-06-24 09:58:19', active: false },
];

const ANDROID_ROWS = [
  { ver: '2.2.0332', pkg: 'com.pusta88.android', force: 'no', url: '', content: '', chg: '2026-01-23 08:57:28', cr: '2026-01-23 08:57:28', active: true },
  { ver: '2.2.0330', pkg: 'com.pusta88.android', force: 'no', url: 'https://pusta88.com/dl/v2.2.0330.apk', content: 'Bug fixes', chg: '2025-12-10 10:00:00', cr: '2025-12-10 10:00:00', active: false },
];

const APK_STEPS = {
  ios: [
    'Generate IPA',
    'Download the latest IPA',
    'Re-sign the downloaded IPA',
    'Click the "Add" button and fill the re-signed address into the TF download URL or AD download URL',
    'Click the "Use" button in the "Action" column to verify the version and download URL are the latest',
    'Click the "Publish" button to release the latest version',
  ],
  android: [
    'Generate APK',
    'Download the latest APK',
    'Re-sign the downloaded APK',
    'Fill the download URL into the AD download URL field',
    'Click "Use" to set as active version',
    'Click "Publish" to release',
  ],
};

const apkNow = () => new Date().toLocaleString('sv-SE').slice(0, 19).replace('T', ' ');
const apkTrunc = (u, n) => (u.length > n ? u.slice(0, n) + '…' : u);

export default function Apk() {
  const { toast } = useUI();
  const [platform, setPlatform] = useState('ios');
  const [adUrl, setAdUrl] = useState({ ios: '', android: '' });
  const [iosRows, setIosRows] = useState(IOS_ROWS);
  const [androidRows, setAndroidRows] = useState(ANDROID_ROWS);

  const [modalOpen, setModalOpen] = useState(false);
  const [editIdx, setEditIdx] = useState(-1);
  const [form, setForm] = useState({ ver: '', pkg: '', url: '', sig: '', content: '', force: 'no' });

  const ios = platform === 'ios';
  const pf = ios ? 'iOS' : 'Android';
  const unit = ios ? 'IPA' : 'APK';
  const rows = ios ? iosRows : androidRows;
  const setRows = ios ? setIosRows : setAndroidRows;
  const active = rows.find((r) => r.active);

  const warn = ios
    ? 'When updating, the system prioritizes the version currently used by the member. If the member is using the AD version, the AD download URL will be used first. If no AD URL is configured, the TF download URL will be used instead.'
    : 'When updating, the system prioritizes the AD download URL. If no AD URL is configured, the TF download URL will be used instead.';

  const tab = (p) => {
    if (p === platform) return;
    setPlatform(p);
  };

  const use = (i) => {
    const ver = rows[i].ver;
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, active: true, chg: apkNow() } : { ...r, active: false })));
    toast('Version set active ✅ ' + ver + ' — now used by members (' + (ios ? 'iOS' : 'Android') + ')');
  };

  const del = (i) => {
    if (rows[i].active) {
      toast('⚠ Cannot delete the active version — set another as active first');
      return;
    }
    const ver = rows[i].ver;
    setRows((prev) => prev.filter((_, idx) => idx !== i));
    toast('Version deleted 🗑 ' + ver);
  };

  const publish = () => {
    const a = active;
    if (!a) {
      toast('⚠ No active version — click "use" on a version first');
      return;
    }
    setRows((prev) => prev.map((r) => (r.active ? { ...r, chg: apkNow() } : r)));
    toast('Published 🚀 ' + (ios ? 'iOS' : 'Android') + ' ' + a.ver + ' released to members' + (adUrl[platform] ? ' · AD URL set' : ''));
  };

  const gen = () => {
    const last = rows.map((r) => r.ver).filter((v) => /^\d+\.\d+\.\d+$/.test(v)).sort().pop() || '2.2.0332';
    const parts = last.split('.');
    parts[2] = String(+parts[2] + 1).padStart(4, '0');
    const nv = parts.join('.');
    const rec = { ver: nv, pkg: ios ? '' : 'com.pusta88.android', force: 'no', url: '', content: 'Auto-generated build', chg: apkNow(), cr: apkNow(), active: false };
    if (ios) rec.sig = '';
    setRows((prev) => [rec, ...prev]);
    toast('New ' + unit + ' generated 🛠 ' + nv + ' — download, re-sign, then click "use"');
  };

  const refresh = () => {
    toast('Build results refreshed 🔄 ' + rows.length + ' ' + (ios ? 'iOS' : 'Android') + ' versions');
  };

  const downloadRow = (i) => {
    toast('Downloading ⬇ ' + rows[i].ver);
  };

  const downloadTF = () => {
    const a = active;
    toast('TF package downloading ⬇ ' + (a ? a.ver : 'latest'));
  };

  const downloadAD = () => {
    const u = adUrl[platform];
    if (!u) {
      toast('⚠ No AD package URL configured — enter one in the field above');
      return;
    }
    toast('AD package downloading ⬇ ' + apkTrunc(u, 40));
  };

  const copyUrl = (i) => {
    const u = rows[i].url;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(u).then(() => toast('URL copied 📋 ' + apkTrunc(u, 40))).catch(() => toast(u));
    } else {
      toast(u);
    }
  };

  const openAdd = () => {
    setEditIdx(-1);
    setForm({ ver: '', pkg: '', url: '', sig: '', content: '', force: 'no' });
    setModalOpen(true);
  };

  const edit = (i) => {
    const r = rows[i];
    setEditIdx(i);
    setForm({ ver: r.ver, pkg: r.pkg || '', url: r.url || '', sig: r.sig || '', content: r.content || '', force: r.force || 'no' });
    setModalOpen(true);
  };

  const close = () => setModalOpen(false);

  const save = () => {
    const ver = form.ver.trim();
    if (!ver) {
      toast('⚠ Version is required');
      return;
    }
    const url = form.url.trim();
    if (url && !/^https?:\/\//i.test(url) && !/^[a-z0-9.-]+\.[a-z]{2,}/i.test(url)) {
      toast('⚠ AD URL looks invalid');
      return;
    }
    if (editIdx < 0 && rows.some((r) => r.ver === ver)) {
      toast('⚠ Version already exists: ' + ver);
      return;
    }
    const data = { ver, pkg: form.pkg.trim(), force: form.force, url, content: form.content.trim(), chg: apkNow() };
    if (ios) data.sig = form.sig.trim();
    if (editIdx < 0) {
      data.cr = apkNow();
      data.active = false;
      setRows((prev) => [data, ...prev]);
      toast('Version added ✅ ' + ver + ' — click "use" to activate');
    } else {
      setRows((prev) => prev.map((r, idx) => (idx === editIdx ? { ...r, ...data } : r)));
      toast('Version updated 💾 ' + ver);
    }
    close();
  };

  const steps = APK_STEPS[platform];
  const head = ios
    ? ['iOS Version', 'Package Name', 'Force Update', 'AD Package Download URL', 'iOS Signature Address 3', 'iOS Update Content', 'Change The Time', 'Creation Time', 'Operate']
    : ['Android Version', 'Package Name', 'Force Update', 'AD Package Download URL', 'Android Update Content', 'Change The Time', 'Creation Time', 'Operate'];

  const verLbl = (ios ? 'iOS' : 'Android') + ' Version';
  const contentLbl = pf + ' Update Content';
  const title = (editIdx < 0 ? 'Add ' : 'Edit ') + pf + ' Version';
  const saveBtnText = editIdx < 0 ? '✅ Add Version' : '💾 Save Changes';

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">📦 APP Configuration Update</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Manage iOS and Android app builds, IPA/APK uploads and distribution URLs</div>
        </div>
      </div>

      <div className="apk-toggle">
        <button className={ios ? 'on' : ''} onClick={() => tab('ios')}>iOS</button>
        <button className={ios ? '' : 'on'} onClick={() => tab('android')}>Android</button>
      </div>

      <div className="apk-top">
        {/* config block */}
        <div className="apk-cfg">
          <div className="apk-pubrow"><button className="btn-white" onClick={publish}>📤 publish</button></div>
          <div className="apk-cfgtbl">
            <div className="pl">{pf} version</div>
            <div className="pc"><span className="apk-ver">{active ? active.ver : '—'}</span></div>
            <div className="pl">AD package download URL</div>
            <div className="pc">
              <input
                type="text"
                value={adUrl[platform]}
                onChange={(e) => setAdUrl((prev) => ({ ...prev, [platform]: e.target.value }))}
                placeholder="Enter AD package download URL"
              />
            </div>
            {ios && (
              <>
                <div className="pl" style={{ alignItems: 'flex-start', paddingTop: '14px' }}>iOS signature address 3</div>
                <div className="pc" style={{ display: 'block' }}>
                  <table className="apk-sigtbl">
                    <thead>
                      <tr>
                        <th>Package Name</th>
                        <th>TF Version</th>
                        <th>Link</th>
                        <th>Valid Days</th>
                        <th>Days Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan="5" className="apk-sig-empty">No signature records — generate an IPA to populate</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* steps block */}
        <div className="apk-steps">
          <div className="h">App version update steps:</div>
          {steps.map((s, i) => (
            <div className="st" key={i}><b>{i + 1}-</b><span>{s}</span></div>
          ))}
        </div>
      </div>

      <div className="apk-acts">
        {ios ? (
          <>
            <button className="apk-btn" onClick={openAdd}>+ Add To</button>
            <button className="apk-btn" onClick={gen}>+ Generate IPA</button>
            <button className="apk-btn" onClick={() => toast('Build records generated 📜 ' + iosRows.length + ' iOS versions on record')}>Generate Records</button>
            <button className="apk-btn" onClick={downloadTF}>⬇ Download TF Package</button>
            <button className="apk-btn" onClick={downloadAD}>⬇ Download AD Package</button>
            <button className="apk-btn blue" onClick={refresh}>🔄 Refresh Build Results</button>
          </>
        ) : (
          <>
            <button className="apk-btn" onClick={openAdd}>+ Add To</button>
            <button className="apk-btn" onClick={gen}>+ Generate APK</button>
            <button className="apk-btn blue" onClick={refresh}>🔄 Refresh Build Results</button>
            <button className="apk-btn" onClick={downloadAD}>⬇ Download AD Package</button>
          </>
        )}
        <div className="apk-warn">{warn}</div>
      </div>

      <div className="card" style={{ marginTop: '16px', padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ minWidth: ios ? '1240px' : '1040px' }}>
            <thead>
              <tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const verCell = r.active ? <span className="apk-redver">{r.ver}</span> : r.ver;
                const pkgCell = r.pkg || <span style={{ opacity: 0.5 }}>—</span>;
                const urlCell = r.url ? (
                  <a className="apk-tbl-link" href="#" onClick={(e) => { e.preventDefault(); copyUrl(i); }}>{apkTrunc(r.url, 30)}</a>
                ) : (
                  <span style={{ opacity: 0.5 }}>—</span>
                );
                const op = (
                  <td className="apk-opcell">
                    <div className="apk-op">
                      <button className="b dl" onClick={() => downloadRow(i)}>download</button>
                      {r.active ? <span className="b active">✓ active</span> : <button className="b use" onClick={() => use(i)}>use</button>}
                      <button className="b ed" onClick={() => edit(i)}>edit</button>
                      <button className="b del" onClick={() => del(i)}>delete</button>
                    </div>
                  </td>
                );
                return (
                  <tr key={i}>
                    <td>{verCell}</td>
                    <td>{pkgCell}</td>
                    <td><span className="apk-fbadge">{r.force}</span></td>
                    <td>{urlCell}</td>
                    {ios && (
                      <td>{r.sig ? (/^https?:/.test(r.sig) ? <span className="apk-tbl-link">{apkTrunc(r.sig, 28)}</span> : r.sig) : <span style={{ opacity: 0.5 }}>—</span>}</td>
                    )}
                    <td>{r.content || <span style={{ opacity: 0.5 }}>—</span>}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '.72rem', whiteSpace: 'nowrap' }}>{r.chg}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '.72rem', whiteSpace: 'nowrap' }}>{r.cr}</td>
                    {op}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="pm-modal" style={{ maxWidth: '520px' }}>
            <div className="pm-head">
              <span style={{ fontSize: '1.1rem' }}>📦</span>
              <span><div className="nm">{title}</div></span>
              <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={close}>✕</button>
            </div>
            <div className="pm-body">
              <div className="pm-grid">
                <div className="pm-fld">
                  <label>{verLbl}</label>
                  <input placeholder="e.g. 2.2.0335" value={form.ver} onChange={(e) => setForm((f) => ({ ...f, ver: e.target.value }))} />
                </div>
                <div className="pm-fld">
                  <label>Package Name</label>
                  <input placeholder="e.g. com.pusta88.android" value={form.pkg} onChange={(e) => setForm((f) => ({ ...f, pkg: e.target.value }))} />
                </div>
              </div>
              <div className="pm-fld" style={{ margin: '12px 0' }}>
                <label>AD Package Download URL</label>
                <input placeholder="https://…" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
              </div>
              {ios && (
                <div className="pm-fld" style={{ marginBottom: '12px' }}>
                  <label>iOS Signature Address 3</label>
                  <input placeholder="Optional signature URL / id" value={form.sig} onChange={(e) => setForm((f) => ({ ...f, sig: e.target.value }))} />
                </div>
              )}
              <div className="pm-grid">
                <div className="pm-fld">
                  <label>Force Update</label>
                  <select value={form.force} onChange={(e) => setForm((f) => ({ ...f, force: e.target.value }))}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="pm-fld">
                  <label>{contentLbl}</label>
                  <input placeholder="e.g. Bug fixes" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="pm-foot">
              <button className="btn-cancel" onClick={close}>Cancel</button>
              <button className="btn-pm-save" onClick={save}>{saveBtnText}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
