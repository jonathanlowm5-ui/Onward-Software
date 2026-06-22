import { Table, BOk, BPend, MiniBtn } from '../components/ui.jsx';

export default function Bonuses() {
  const cols = ['Bonus', 'Type', 'Amount', 'Turnover', 'Status', 'Actions'];
  const rows = [
    ['Welcome 100%', 'First Deposit', '100% up to ₱5,000', 'x20', <BOk>Active</BOk>,
      <><MiniBtn>Edit</MiniBtn> <MiniBtn className="red">Pause</MiniBtn></>],
    ['Daily Reload', 'Reload', '20% up to ₱1,000', 'x10', <BOk>Active</BOk>,
      <><MiniBtn>Edit</MiniBtn> <MiniBtn className="red">Pause</MiniBtn></>],
    ['Cashback Friday', 'Cashback', '5% losses', 'x1', <BPend>Scheduled</BPend>,
      <MiniBtn>Edit</MiniBtn>],
    ['Birthday Gift', 'Free Credit', '₱188', 'x5', <BOk>Active</BOk>,
      <MiniBtn>Edit</MiniBtn>],
  ];

  return (
    <>
      <h1 className="hero-h">Bonuses</h1>
      <div className="hero-sub">Bonus configuration &amp; management.</div>
      <div className="card">
        <Table cols={cols} rows={rows} />
      </div>
    </>
  );
}
