import { Table, BOk, BPend, BBad, BInfo, ToolbarSearch } from '../components/ui.jsx';

export default function Audit() {
  const cols = ['Time', 'User', 'Action', 'Target', 'IP'];
  const rows = [
    ['10:42:08', 'superadmin', <BInfo>LOGIN</BInfo>, '—', '203.0.113.4'],
    ['10:44:51', 'finance.ops', <BOk>APPROVE</BOk>, 'WD-50228 ₱2,500', '203.0.113.9'],
    ['10:51:13', 'superadmin', <BPend>EDIT</BPend>, 'VIP Level V7 config', '203.0.113.4'],
    ['11:02:40', 'cs.lead', <BBad>REJECT</BBad>, 'KYC LGX09112VND', '198.51.100.7'],
  ];
  return (
    <>
      <h1 className="hero-h">Audit Logs</h1>
      <div className="hero-sub">System action / audit log.</div>
      <div className="card">
        <ToolbarSearch placeholder="Search action, user, IP…" />
        <Table cols={cols} rows={rows} />
      </div>
    </>
  );
}
