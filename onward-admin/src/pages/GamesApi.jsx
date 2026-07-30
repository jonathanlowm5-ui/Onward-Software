import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { getSettings, updateSettings } from '../services/cmsService';
import { pingUrl } from '../services/configService';
import api from '../services/api';

// Real game-aggregator API config — credentials saved to backend settings,
// catalog import pulls the upstream provider into the local games collection.
export default function GamesApi() {
  const { toast } = useUI();
  const [form, setForm] = useState({ baseUrl: '', apiKey: '', apiSecret: '', environment: 'development' });
  const [secretSet, setSecretSet] = useState(false);
  const [status, setStatus] = useState(null); // {provider, configured, environment}
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [testOut, setTestOut] = useState(null);

  const load = () => Promise.all([
    getSettings(),
    api.get('/aggregator/status').then((r) => r.data).catch(() => null),
  ]).then(([s, st]) => {
    setForm({ baseUrl: s?.baseUrl || '', apiKey: s?.apiKey || '', apiSecret: '', environment: s?.environment || 'development' });
    setSecretSet(!!s?.apiSecretSet);
    setStatus(st);
    setLoaded(true);
  }).catch((e) => { setLoaded(true); toast('⚠ ' + (e.message || 'Failed to load API settings')); });
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const patch = { baseUrl: form.baseUrl, apiKey: form.apiKey, environment: form.environment };
      if (form.apiSecret) patch.apiSecret = form.apiSecret; // only overwrite when a new secret is typed
      await updateSettings(patch);
      toast('Aggregator API settings saved 💾');
      load();
    } catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
    finally { setSaving(false); }
  };

  const test = async () => {
    if (!form.baseUrl) { toast('⚠ Enter a Base URL first'); return; }
    setTesting(true);
    setTestOut(null);
    try {
      const r = await pingUrl(form.baseUrl);
      if (r.ok) { setTestOut(`✓ ${form.baseUrl}\nHTTP ${r.status} · ${r.ms}ms — reachable`); toast(`Connection OK ✓ ${r.status} · ${r.ms}ms`); }
      else { setTestOut(`✗ ${form.baseUrl}\n${r.error ? 'ERROR: ' + r.error : 'HTTP ' + r.status}${r.ms ? ' · ' + r.ms + 'ms' : ''}`); toast('⚠ Connection failed — ' + (r.error || 'HTTP ' + r.status)); }
    } catch (e) { setTestOut('✗ ' + (e.message || 'Ping failed')); toast('⚠ ' + (e.message || 'Ping failed')); }
    finally { setTesting(false); }
  };

  const importCatalog = async () => {
    setImporting(true);
    try {
      const r = await api.post('/aggregator/import').then((x) => x.data);
      toast(`Catalog imported 📥 ${r.provider}: ${r.imported} new · ${r.updated} updated · ${r.total} total`);
      setTestOut(`✓ Import — ${r.provider}\nimported: ${r.imported}\nupdated: ${r.updated}\ncatalog total: ${r.total}`);
    } catch (e) { toast('⚠ Import failed — ' + (e.message || 'error')); setTestOut('✗ Import failed\n' + (e.message || '')); }
    finally { setImporting(false); }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">🎮 Games API</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Game aggregator integration — credentials, environment, connection test and catalog import</div>
        </div>
        <span className="pr" style={{ display: 'flex', gap: 8 }}>
          <button className="mini-btn" disabled={testing} onClick={test}>{testing ? 'Testing…' : '⚡ Test Connection'}</button>
          <button className="btn-search" disabled={importing} onClick={importCatalog}>{importing ? 'Importing…' : '📥 Import Catalog'}</button>
        </span>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Provider</div><div className="val" style={{ fontSize: '1.3rem' }}>{status?.provider || '—'}</div><div className="trend" style={{ color: 'var(--muted)' }}>aggregator driver</div></div>
        <div className="card kpi g"><div className="lbl">Configured</div><div className="val">{status ? (status.configured ? '✅' : '—') : '…'}</div><div className="trend" style={{ color: 'var(--muted)' }}>{status?.configured ? 'base URL set' : 'set base URL below'}</div></div>
        <div className="card kpi"><div className="lbl">Environment</div><div className="val" style={{ fontSize: '1.3rem' }}>{status?.environment || form.environment}</div><div className="trend" style={{ color: 'var(--muted)' }}>active mode</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">API Secret</div><div className="val">{secretSet ? '🔒' : '—'}</div><div className="trend" style={{ color: 'var(--muted)' }}>{secretSet ? 'stored (write-only)' : 'not set'}</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="card-title">🔌 Aggregator Credentials</div>
        {!loaded ? <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 26 }}>Loading…</div> : (
          <>
            <div className="pm-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
              <div className="pm-fld"><label>Base URL</label>
                <input value={form.baseUrl} onChange={(e) => set('baseUrl', e.target.value)} placeholder="https://api.aggregator.example/v1" /></div>
              <div className="pm-fld"><label>Environment</label>
                <select value={form.environment} onChange={(e) => set('environment', e.target.value)}>
                  <option value="development">Development</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>
            <div className="pm-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 10 }}>
              <div className="pm-fld"><label>API Key</label>
                <input value={form.apiKey} onChange={(e) => set('apiKey', e.target.value)} placeholder="pk_…" /></div>
              <div className="pm-fld"><label>API Secret {secretSet && <span style={{ color: 'var(--muted)' }}>(stored — leave blank to keep)</span>}</label>
                <input type="password" value={form.apiSecret} onChange={(e) => set('apiSecret', e.target.value)} placeholder={secretSet ? '••••••••' : 'sk_…'} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn-pm-save" disabled={saving} onClick={save}>{saving ? 'Saving…' : '💾 Save Settings'}</button>
            </div>
          </>
        )}
      </div>

      <div className="api-console" style={{ marginTop: 'var(--pad)' }}>
        <div className="ach">🧪 Connection / Import Output</div>
        <div className="abody">
          <div className="api-out" style={{ width: '100%' }}>
            {testOut == null
              ? <span className="muted">{'// Run ⚡ Test Connection or 📥 Import Catalog to see results here'}</span>
              : testOut}
          </div>
        </div>
      </div>
    </>
  );
}
