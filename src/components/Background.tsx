export default function Background() {
  return (
    <div className="deco" aria-hidden="true">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
    <symbol id="leaf" viewBox="0 -10 30 20"><path d="M0 0C7-10 22-10 30 0C22 10 7 10 0 0Z" fill="currentColor"/><path d="M1 0H28" stroke="#0F1D17" strokeOpacity=".35" strokeWidth="1"/></symbol>
    <symbol id="flower" viewBox="-12 -12 24 24">
      <g fill="currentColor"><ellipse cx="0" cy="-6" rx="3.6" ry="6"/><ellipse cx="0" cy="-6" rx="3.6" ry="6" transform="rotate(72)"/><ellipse cx="0" cy="-6" rx="3.6" ry="6" transform="rotate(144)"/><ellipse cx="0" cy="-6" rx="3.6" ry="6" transform="rotate(216)"/><ellipse cx="0" cy="-6" rx="3.6" ry="6" transform="rotate(288)"/></g>
      <circle r="2.6" fill="#9FE0B8"/>
    </symbol>
    <symbol id="petal" viewBox="0 0 12 18"><path d="M6 0C12 5 11 14 6 18C1 14 0 5 6 0Z" fill="currentColor"/></symbol>
  </defs>
      </svg>
        <svg viewBox="0 0 360 520" preserveAspectRatio="xMidYMid slice" style={{ inset: 0, width: '100%', height: '100%' }}>
            <defs>
              <radialGradient id="g1"><stop offset="0" stopColor="#4FB287" stopOpacity=".35"/><stop offset="1" stopColor="#4FB287" stopOpacity="0"/></radialGradient>
              <radialGradient id="g2"><stop offset="0" stopColor="#9FE0B8" stopOpacity=".18"/><stop offset="1" stopColor="#9FE0B8" stopOpacity="0"/></radialGradient>
            </defs>
            <circle className="glow" cx="320" cy="470" r="200" fill="url(#g1)"/>
            <circle className="glow" cx="20" cy="60" r="150" fill="url(#g2)" style={{ animationDelay: '-3s' }}/>
          </svg>
        <svg className="sway" viewBox="0 0 200 260" width="210" style={{ right: '-20px', bottom: '-10px', color: '#4FB287', opacity: .22 }}>
            <path d="M190 260C170 200 160 150 120 110S60 40 40 10" fill="none" stroke="#4FB287" strokeWidth="2"/>
            <use href="#leaf" x="150" y="200" width="34" height="22" transform="rotate(-50 167 211)"/>
            <use href="#leaf" x="130" y="170" width="34" height="22" transform="rotate(150 147 181)"/>
            <use href="#leaf" x="115" y="120" width="34" height="22" transform="rotate(-70 132 131)"/>
            <use href="#leaf" x="85" y="95" width="30" height="20" transform="rotate(170 100 105)"/>
            <use href="#leaf" x="62" y="58" width="28" height="18" transform="rotate(-80 76 67)"/>
            <use href="#flower" x="22" y="-6" width="34" height="34" style={{ color: '#9FE0B8' }}/>
            <use href="#flower" x="150" y="128" width="24" height="24" style={{ color: '#9FE0B8' }}/>
          </svg>
          <svg className="sway" viewBox="0 0 120 300" width="110" style={{ right: '6px', bottom: '-12px', color: '#4FB287', opacity: .18, animationDuration: '10s', animationDelay: '-4s' }}>
            <path d="M100 300C95 240 105 190 80 140S40 60 50 10" fill="none" stroke="#4FB287" strokeWidth="2"/>
            <use href="#leaf" x="82" y="245" width="30" height="20" transform="rotate(-80 97 255)"/>
            <use href="#leaf" x="70" y="200" width="30" height="20" transform="rotate(200 85 210)"/>
            <use href="#leaf" x="70" y="150" width="28" height="18" transform="rotate(-100 84 159)"/>
            <use href="#leaf" x="42" y="100" width="26" height="17" transform="rotate(190 55 108)"/>
            <use href="#flower" x="36" y="-4" width="28" height="28" style={{ color: '#9FE0B8' }}/>
          </svg>
          <svg className="sway" viewBox="0 0 260 120" width="230" style={{ right: '-10px', bottom: '-14px', color: '#4FB287', opacity: .15, animationDuration: '12s', animationDelay: '-7s' }}>
            <path d="M260 115C210 110 170 95 130 70S50 40 10 50" fill="none" stroke="#4FB287" strokeWidth="2"/>
            <use href="#leaf" x="200" y="90" width="28" height="18" transform="rotate(-160 214 99)"/>
            <use href="#leaf" x="150" y="68" width="28" height="18" transform="rotate(20 164 77)"/>
            <use href="#leaf" x="100" y="46" width="26" height="17" transform="rotate(-170 113 54)"/>
            <use href="#leaf" x="55" y="36" width="24" height="16" transform="rotate(10 67 44)"/>
            <use href="#flower" x="0" y="36" width="24" height="24" style={{ color: '#9FE0B8' }}/>
          </svg>
          <svg className="sway tl" viewBox="0 0 140 140" width="130" style={{ left: '-14px', top: '-14px', color: '#4FB287', opacity: .16 }}>
            <path d="M0 0C30 20 50 40 70 80S100 120 130 130" fill="none" stroke="#4FB287" strokeWidth="2"/>
            <use href="#leaf" x="25" y="15" width="28" height="18" transform="rotate(40 39 24)"/>
            <use href="#leaf" x="50" y="50" width="28" height="18" transform="rotate(-130 64 59)"/>
            <use href="#flower" x="105" y="105" width="28" height="28" style={{ color: '#9FE0B8' }}/>
          </svg>
        <svg viewBox="0 0 360 520" preserveAspectRatio="xMidYMid slice" style={{ inset: 0, width: '100%', height: '100%', color: '#9FE0B8' }}>
            <use className="petal" href="#petal" x="40" y="0" width="10" height="15" style={{ animationDuration: '19s' }}/>
            <use className="petal" href="#petal" x="180" y="80" width="8" height="12" style={{ animationDuration: '24s', animationDelay: '-8s' }}/>
            <use className="petal" href="#petal" x="290" y="20" width="11" height="16" style={{ animationDuration: '21s', animationDelay: '-14s' }}/>
          </svg>
    </div>
  )
}
