import { useUI } from '../../context/UIContext';
import { BW_DATA } from '../../services/data/gameData';

// Mirrors renderBWStrip(): BW_DATA duplicated for a seamless looping marquee.
export default function BigWinsStrip() {
  const { openModal } = useUI();
  const items = [...BW_DATA, ...BW_DATA];
  return (
    <div className="bw-strip">
      <div className="bw-strip-header" data-i18n="sec_big_wins">Big Wins</div>
      <div className="bw-track" id="bw-track">
        {items.map((w, i) => (
          <div className="bw-card" key={i} onClick={() => openModal('register')}>
            <div className="bw-thumb" style={{ background: w.c }}>{w.i}</div>
            <div className="bw-info">
              <div className="bw-name">{w.n}</div>
              <div className="bw-meta">
                <span>{w.user}</span>
                <span className="bw-mult">{w.mult}</span>
              </div>
              <div className="bw-prize">{w.prize}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
