import { useState } from 'react';
import { useUI } from '../context/UIContext';

// Original WEBCFG defaults.
const WEBCFG = {
  provider: 'Cloudflare',
  origin: 'https://origin.onward.app',
  dist: 'https://cdn.onward.app',
  token: 'cf_zone_a1b2c3d4e5f6g7h8',
  cache: true,
  minify: true,
  http2: true,
};

const WEBDOM = [
  { dom: 'onward.app', ssl: true, status: 'active', primary: true, active: true },
  { dom: 'www.onward.app', ssl: true, status: 'active', primary: false, active: true },
  { dom: 'm.onward.app', ssl: true, status: 'active', primary: false, active: true },
  { dom: 'cdn.onward.app', ssl: true, status: 'active', primary: false, active: true },
  { dom: 'api.onward.app', ssl: true, status: 'active', primary: false, active: true },
  { dom: 'onward.ph', ssl: true, status: 'active', primary: false, active: true },
  { dom: 'staging.onward.app', ssl: true, status: 'active', primary: false, active: true },
  { dom: '88xx11.com', ssl: false, status: 'inactive', primary: false, active: false },
];

const WEBDNS = [
  { type: 'A', name: '@', val: '104.21.45.67', ttl: 'Auto', proxy: true },
  { type: 'A', name: '@', val: '172.67.182.34', ttl: 'Auto', proxy: true },
  { type: 'CNAME', name: 'www', val: 'onward.app', ttl: 'Auto', proxy: true },
  { type: 'CNAME', name: 'cdn', val: 'd1abc123.cloudfront.net', ttl: 'Auto', proxy: false },
  { type: 'CNAME', name: 'api', val: 'api-origin.onward.app', ttl: '3600', proxy: true },
  { type: 'CNAME', name: 'm', val: 'onward.app', ttl: 'Auto', proxy: true },
  { type: 'MX', name: '@', val: '10 mail.onward.app', ttl: '3600', proxy: false },
  { type: 'TXT', name: '@', val: 'v=spf1 include:_spf.google.com ~all', ttl: '3600', proxy: false },
  { type: 'TXT', name: '_dmarc', val: 'v=DMARC1; p=reject; rua=mailto:dmarc@onward.app', ttl: '3600', proxy: false },
  { type: 'TXT', name: '_domainkey', val: 'v=DKIM1; k=rsa; p=MIGfMA0GCS...', ttl: '3600', proxy: false },
  { type: 'NS', name: '@', val: 'aria.ns.cloudflare.com', ttl: '86400', proxy: false },
  { type: 'NS', name: '@', val: 'bob.ns.cloudflare.com', ttl: '86400', proxy: false },
  { type: 'A', name: '@', val: '104.21.45.67', ttl: 'Auto', proxy: true },
  { type: 'CNAME', name: 'www', val: 'onward.ph', ttl: 'Auto', proxy: true },
];

const WEBDNSF = 'all';

const TOG_NAMES = { cache: 'Cache', minify: 'Minify Assets', http2: 'HTTP/2 Push' };

export default function WebSettings() {
  const { toast } = useUI();
  const [cfg, setCfg] = useState(WEBCFG);
  const [domains, setDomains] = useState(WEBDOM);
  const [dns, setDns] = useState(WEBDNS);
  const [dnsFilter, setDnsFilter] = useState(WEBDNSF);

  const activeDom = domains.filter((d) => d.active).length;
  const setField = (k, v) => setCfg((p) => ({ ...p, [k]: v }));

  const tog = (k) => {
    setCfg((p) => {
      const on = !p[k];
      toast(TOG_NAMES[k] + (on ? ' enabled ✅' : ' disabled ⚫'));
      return { ...p, [k]: on };
    });
  };

  const save = () => {
    if (cfg.origin && !/^https?:\/\//i.test(cfg.origin)) {
      toast('⚠ CDN Origin URL must start with http(s)://');
      return;
    }
    toast(
      'Web settings saved ✅ ' +
        cfg.provider +
        ' · ' +
        activeDom +
        ' domains · ' +
        dns.length +
        ' DNS records'
    );
  };

  const refresh = () => {
    toast('CDN + DNS refreshed ↻ ' + activeDom + ' active domains · SSL valid');
  };

  const purge = () => {
    toast('Purging CDN cache 🗑 ' + cfg.provider + '…');
    setTimeout(() => toast('CDN cache purged ✅ edge nodes cleared globally'), 900);
  };

  const domToggle = (i) => {
    const d = domains[i];
    if (d.primary && d.active) {
      toast('⚠ Cannot disable the primary domain — set another primary first');
      return;
    }
    const active = !d.active;
    setDomains((p) =>
      p.map((x, idx) => (idx === i ? { ...x, active, status: active ? 'active' : 'inactive' } : x))
    );
    toast((active ? 'Domain enabled ✅ ' : 'Domain disabled ⚫ ') + d.dom);
  };

  const domPrimary = (i) => {
    if (!domains[i].active) {
      toast('⚠ Enable the domain before making it primary');
      return;
    }
    setDomains((p) => p.map((x, idx) => ({ ...x, primary: idx === i })));
    toast('Primary domain set ⭐ ' + domains[i].dom);
  };

  const domAdd = () => {
    const dom = window.prompt('New domain (e.g. promo.onward.app):');
    if (!dom) return;
    const d = dom.trim().toLowerCase();
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) {
      toast('⚠ Invalid domain: ' + d);
      return;
    }
    if (domains.some((x) => x.dom === d)) {
      toast('⚠ Domain already exists');
      return;
    }
    setDomains((p) => [...p, { dom: d, ssl: false, status: 'inactive', primary: false, active: false }]);
    toast('Domain added ✅ ' + d + ' — enable + set SSL to activate');
  };

  const dnsDel = (i) => {
    const r = dns[i];
    setDns((p) => p.filter((_, idx) => idx !== i));
    toast('DNS record deleted 🗑 ' + r.type + ' ' + r.name);
  };

  const dnsEdit = (i) => {
    const r = dns[i];
    const v = window.prompt('Edit value for ' + r.type + ' ' + r.name + ':', r.val);
    if (v == null) return;
    setDns((p) => p.map((x, idx) => (idx === i ? { ...x, val: v.trim() } : x)));
    toast('DNS record updated 💾 ' + r.type + ' ' + r.name);
  };

  const dnsAdd = () => {
    const type = window.prompt('Record type (A, CNAME, MX, TXT, NS):', 'A');
    if (!type) return;
    const t = type.trim().toUpperCase();
    if (!['A', 'CNAME', 'MX', 'TXT', 'NS'].includes(t)) {
      toast('⚠ Unsupported type: ' + t);
      return;
    }
    const name = window.prompt('Name (e.g. @ or www):', '@');
    if (name == null) return;
    const val = window.prompt('Value / content:', '');
    if (val == null) return;
    setDns((p) => [
      { type: t, name: name.trim() || '@', val: val.trim(), ttl: 'Auto', proxy: t === 'A' || t === 'CNAME' },
      ...p,
    ]);
    toast('DNS record added ✅ ' + t + ' ' + (name.trim() || '@'));
  };

  const dnsVisible = dns
    .map((r, idx) => ({ r, idx }))
    .filter(({ r }) => dnsFilter === 'all' || r.type === dnsFilter);

  return (
    <>
      <div className="set-head">
        <div className="grow">
          <h1 className="hero-h">🌐 Web Settings</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>
            Frontend CDN, DNS records, domain routing, SSL and performance configuration
          </div>
        </div>
        <div className="acts">
          <button className="set-refresh" onClick={refresh}>↻ Refresh</button>
          <button className="set-saveall" onClick={save}>💾 Save All</button>
        </div>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi b">
          <div className="lbl">CDN Status</div>
          <div className="val" style={{ color: 'var(--green)', fontSize: '1.3rem' }}>● Online</div>
          <div className="trend" style={{ color: 'var(--muted)' }}>{cfg.provider}</div>
        </div>
        <div className="card kpi g">
          <div className="lbl">SSL Certificate</div>
          <div className="val" style={{ color: 'var(--blue)', fontSize: '1.3rem' }}>Valid</div>
          <div className="trend" style={{ color: 'var(--muted)' }}>Expires in 180 days</div>
        </div>
        <div className="card kpi">
          <div className="lbl">Active Domains</div>
          <div className="val">{activeDom}</div>
          <div className="trend" style={{ color: 'var(--muted)' }}>configured</div>
        </div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}>
          <div className="lbl">DNS Records</div>
          <div className="val">{dns.length}</div>
          <div className="trend" style={{ color: 'var(--muted)' }}>total records</div>
        </div>
      </div>
      <div className="gss-2col" style={{ marginTop: 'var(--pad)' }}>
        <div className="set-card">
          <div className="ch">⚡ CDN Configuration</div>
          <div className="gss-set-fld">
            <label>CDN Provider</label>
            <select value={cfg.provider} onChange={(e) => setField('provider', e.target.value)}>
              {['Cloudflare', 'AWS CloudFront', 'Fastly', 'Akamai', 'BunnyCDN'].map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="gss-set-fld">
            <label>CDN Origin URL</label>
            <input value={cfg.origin} onChange={(e) => setField('origin', e.target.value)} />
          </div>
          <div className="gss-set-fld">
            <label>CDN Distribution URL</label>
            <input value={cfg.dist} onChange={(e) => setField('dist', e.target.value)} />
          </div>
          <div className="gss-set-fld">
            <label>API / Zone Token</label>
            <input type="password" value={cfg.token} onChange={(e) => setField('token', e.target.value)} />
          </div>
          <div className="web-toggles">
            <div className="web-tog">
              <label className="switch">
                <input type="checkbox" checked={cfg.cache} onChange={() => tog('cache')} />
                <span className="slider"></span>
              </label> Cache Enabled
            </div>
            <div className="web-tog">
              <label className="switch">
                <input type="checkbox" checked={cfg.minify} onChange={() => tog('minify')} />
                <span className="slider"></span>
              </label> Minify Assets
            </div>
            <div className="web-tog">
              <label className="switch">
                <input type="checkbox" checked={cfg.http2} onChange={() => tog('http2')} />
                <span className="slider"></span>
              </label> HTTP/2 Push
            </div>
          </div>
          <button className="web-purge" onClick={purge}>🗑 Purge CDN Cache</button>
        </div>
        <div className="set-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '16px 18px 0' }}>
            <div className="ch" style={{ margin: 0 }}>🌐 Domains</div>
            <button className="web-addbtn" style={{ marginLeft: 'auto' }} onClick={domAdd}>+ Add</button>
          </div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0, marginTop: 12 }}>
            <table className="web-domtbl" style={{ minWidth: 520 }}>
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>SSL</th>
                  <th>Status</th>
                  <th>Primary</th>
                  <th style={{ textAlign: 'center' }}>Act.</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((d, i) => (
                  <tr key={i}>
                    <td className="mono" style={{ color: d.active ? 'var(--text)' : 'var(--muted)' }}>{d.dom}</td>
                    <td>{d.ssl ? <span className="web-ssl-ok">🔒</span> : <span className="web-ssl-no">🔓</span>}</td>
                    <td>{d.status === 'active' ? <span className="web-stat-active">active</span> : <span className="web-stat-inactive">inactive</span>}</td>
                    <td>{d.primary ? <span className="web-prim-star">★</span> : <button className="web-prim-set" onClick={() => domPrimary(i)}>Set</button>}</td>
                    <td style={{ textAlign: 'center' }}>
                      <label className="switch">
                        <input type="checkbox" checked={d.active} onChange={() => domToggle(i)} />
                        <span className="slider"></span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="set-card" style={{ marginTop: 'var(--pad)', padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px 0', flexWrap: 'wrap' }}>
          <div className="ch" style={{ margin: 0 }}>📋 DNS Records</div>
          <div className="web-dnsfilter">
            <select value={dnsFilter} onChange={(e) => setDnsFilter(e.target.value)}>
              <option value="all">All Types</option>
              {['A', 'CNAME', 'MX', 'TXT', 'NS'].map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <button className="web-addbtn" onClick={dnsAdd}>+ Record</button>
          </div>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0, marginTop: 12 }}>
          <table className="web-dnstbl" style={{ minWidth: 880 }}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Value / Content</th>
                <th>TTL</th>
                <th>Proxy</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dnsVisible.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--muted)', padding: 22 }}>No records of this type</td>
                </tr>
              ) : (
                dnsVisible.map(({ r, idx }) => (
                  <tr key={idx}>
                    <td><span className={'web-dnstype dt-' + r.type}>{r.type}</span></td>
                    <td className="mono">{r.name}</td>
                    <td className="mono" style={{ wordBreak: 'break-all' }}>{r.val}</td>
                    <td style={{ color: 'var(--muted)' }}>{r.ttl}</td>
                    <td>{r.proxy ? <span className="web-proxy-on">🧡 Proxied</span> : <span className="web-proxy-off">DNS only</span>}</td>
                    <td>
                      <div className="web-dns-act">
                        <button className="e" onClick={() => dnsEdit(idx)}>✏️</button>
                        <button className="d" onClick={() => dnsDel(idx)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
