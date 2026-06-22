import { useUI } from '../context/UIContext';

/**
 * React equivalents of the original admin HTML-string helpers
 * (tbl, bOk/bPend/bBad/bInfo, act, search). Views use these to stay
 * pixel-identical while being real components.
 */

// tbl(cols, rows) -> .table-wrap > table. Cells may be strings or JSX.
export function Table({ cols, rows, className = '' }) {
  return (
    <div className={`table-wrap ${className}`.trim()}>
      <table>
        <thead>
          <tr>{cols.map((c, i) => <th key={i}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>{r.map((c, ci) => <td key={ci}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const BADGE_CLASS = { ok: 'ok', pend: 'pend', bad: 'bad', info: 'info' };
export const Badge = ({ type = 'info', children }) => (
  <span className={`badge ${BADGE_CLASS[type] || 'info'}`}>{children}</span>
);
export const BOk = ({ children }) => <Badge type="ok">{children}</Badge>;
export const BPend = ({ children }) => <Badge type="pend">{children}</Badge>;
export const BBad = ({ children }) => <Badge type="bad">{children}</Badge>;
export const BInfo = ({ children }) => <Badge type="info">{children}</Badge>;

// Demo action button (toast on click), matching the original act() helper.
export function MiniBtn({ children, className = '', onClick }) {
  const { toast } = useUI();
  const label = typeof children === 'string' ? children : '';
  return (
    <button className={`mini-btn ${className}`.trim()} onClick={onClick || (() => toast(`${label} — demo action`))}>
      {children}
    </button>
  );
}

// search(placeholder) toolbar.
export function ToolbarSearch({ placeholder = 'Search…', onSearch }) {
  const { toast } = useUI();
  return (
    <div className="toolbar">
      <input placeholder={placeholder} />
      <select>
        <option>All Status</option><option>Active</option><option>Pending</option><option>Blocked</option>
      </select>
      <button className="mini-btn gold" onClick={onSearch || (() => toast('🔍 Search — demo'))}>🔍 Search</button>
    </div>
  );
}

export const HeroH = ({ children }) => <h1 className="hero-h">{children}</h1>;
export const HeroSub = ({ children }) => <div className="hero-sub">{children}</div>;
export const Card = ({ children, className = '', style }) => (
  <div className={`card ${className}`.trim()} style={style}>{children}</div>
);
