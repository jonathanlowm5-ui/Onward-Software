import { Table, BOk } from '../components/ui.jsx';
import { useUI } from '../context/UIContext';

// Ported from V["referral-links"] (static tbl).
export default function ReferralLinks() {
  const { toast } = useUI();
  const cols = ['Link', 'Owner', 'Clicks', 'Signups', 'FTD', 'Status'];
  const rows = [
    ['lgx.bet/r/MARIA88', 'LGX10422PHP', '2,108', '204', '61', <BOk>Active</BOk>],
    ['lgx.bet/r/PEDROWIN', 'LGX07733PHP', '8,415', '612', '198', <BOk>Active</BOk>],
    ['lgx.bet/r/ANH123', 'LGX09112VND', '406', '22', '4', <BOk>Active</BOk>],
  ];
  return (
    <>
      <h1 className="hero-h">Referral Links</h1>
      <div className="hero-sub">Generate &amp; track referral links.</div>
      <div className="toolbar"><button className="mini-btn gold" onClick={() => toast('Generate Link — demo')}>＋ Generate Link</button></div>
      <div className="card"><Table cols={cols} rows={rows} /></div>
    </>
  );
}
