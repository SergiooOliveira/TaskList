// Background art from library-mockups/{Books,Manga}.html. Sits fixed behind the content.

export function NightshadeArt() {
  return (
    <div className="lib-art" aria-hidden="true">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <symbol id="ns-bell" viewBox="-14 -6 28 34">
            <g stroke="#CDAA63" strokeWidth="1">
              <path d="M0-6V2" fill="none"/>
              <path d="M-7 2H7L5 6H-5Z" fill="#1A1510"/>
              <path d="M-9 6C-10 16-8 24-11 27C-5 25 5 25 11 27C8 24 10 16 9 6Z" fill="#3E2552"/>
              <path d="M-3 7C-3 16-2 22-4 26M3 7C3 16 2 22 4 26" fill="none" opacity=".6"/>
            </g>
          </symbol>
          <symbol id="ns-leaf" viewBox="0 -9 34 18"><path d="M0 0C9-9 26-8 34 0C26 8 9 9 0 0Z" fill="#141210" stroke="#CDAA63" strokeWidth=".9"/><path d="M2 0H30M10 0l5-4M18 0l5-4M10 0l5 4M18 0l5 4" stroke="#CDAA63" strokeWidth=".5" opacity=".7"/></symbol>
        </defs>
      </svg>
      <svg viewBox="0 0 390 200" style={{ left: 0, top: 0, width: '100%', opacity: .75 }}>
        <path d="M-10 26C70 10 150 40 220 30S330 6 400 22" fill="none" stroke="#CDAA63" strokeWidth="1.4"/>
        <path d="M60 22C64 34 66 44 64 54M150 32C152 46 150 56 146 66M262 24C266 38 266 50 262 60M338 14C340 26 340 34 338 42" fill="none" stroke="#CDAA63" strokeWidth="1"/>
        <use href="#ns-bell" x="50" y="50" width="28" height="34"/>
        <use href="#ns-bell" x="132" y="62" width="30" height="36"/>
        <use href="#ns-bell" x="249" y="56" width="26" height="32"/>
        <use href="#ns-bell" x="327" y="38" width="22" height="27"/>
        <use href="#ns-leaf" x="90" y="18" width="40" height="22" transform="rotate(20 110 29)"/>
        <use href="#ns-leaf" x="186" y="26" width="38" height="20" transform="rotate(-15 205 36)"/>
        <use href="#ns-leaf" x="290" y="6" width="36" height="20" transform="rotate(25 308 16)"/>
        <g fill="#120E16" stroke="#CDAA63" strokeWidth="1"><circle cx="208" cy="58" r="5"/><circle cx="216" cy="64" r="4"/><circle cx="203" cy="67" r="3.5"/></g>
      </svg>
      <svg className="glow" viewBox="-40 -30 80 60" width="70" style={{ right: 22, bottom: 60 }}>
        <g fill="#120E16" stroke="#CDAA63" strokeWidth="1">
          <path d="M0 0C-10-22-34-26-36-12C-38 0-20 6 0 0Z"/>
          <path d="M0 0C10-22 34-26 36-12C38 0 20 6 0 0Z"/>
          <path d="M0 2C-8 10-22 20-26 12C-28 6-14 2 0 2Z"/>
          <path d="M0 2C8 10 22 20 26 12C28 6 14 2 0 2Z"/>
          <ellipse cx="0" cy="2" rx="2.4" ry="9"/>
        </g>
        <g fill="none" stroke="#CDAA63" strokeWidth=".7"><circle cx="-22" cy="-12" r="4"/><circle cx="22" cy="-12" r="4"/><path d="M-1-6C-4-14-8-18-12-20M1-6C4-14 8-18 12-20"/></g>
      </svg>
    </div>
  )
}

export function HiganbanaArt() {
  return (
    <div className="lib-art" aria-hidden="true">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <symbol id="hg-lily" viewBox="-40 -40 80 80">
            <g fill="none" stroke="#CDAA63" strokeWidth=".7" strokeLinecap="round">
              <path d="M0 0C-6-14-22-22-30-36M0 0C6-14 22-22 30-36M0 0C-12-8-30-8-38-18M0 0C12-8 30-8 38-18M0 0C-2-16-4-28-2-40M0 0C2-16 6-28 8-40"/>
            </g>
            <g fill="#B5321F" stroke="#E0604A" strokeWidth=".8">
              <path d="M0 0C-8-4-16-2-20 4C-22 8-18 10-16 6C-14 2-8 0 0 0Z"/>
              <path d="M0 0C8-4 16-2 20 4C22 8 18 10 16 6C14 2 8 0 0 0Z"/>
              <path d="M0 0C-4-8-4-16 2-20C6-22 8-18 4-16C0-14-2-8 0 0Z"/>
              <path d="M0 0C-6 4-14 10-14 16C-14 20-10 19-10 15C-10 10-5 5 0 0Z"/>
              <path d="M0 0C6 4 14 10 14 16C14 20 10 19 10 15C10 10 5 5 0 0Z"/>
              <path d="M0 0C4-8 10-14 16-14C20-14 19-10 15-10C10-10 5-5 0 0Z"/>
            </g>
            <g fill="#CDAA63"><circle cx="-30" cy="-36" r="1.4"/><circle cx="30" cy="-36" r="1.4"/><circle cx="-38" cy="-18" r="1.4"/><circle cx="38" cy="-18" r="1.4"/><circle cx="-2" cy="-40" r="1.4"/><circle cx="8" cy="-40" r="1.4"/></g>
          </symbol>
        </defs>
      </svg>
      <svg viewBox="0 0 390 260" style={{ left: 0, top: 0, width: '100%' }}>
        <g className="glow">
          <circle cx="300" cy="120" r="92" fill="#B5321F" opacity=".16"/>
          <circle cx="300" cy="120" r="92" fill="none" stroke="#E0604A" strokeWidth=".8" opacity=".35"/>
        </g>
        <g fill="none" stroke="#EDE6DC" strokeWidth=".8" opacity=".09">
          <path d="M-10 240C60 224 120 252 200 236S330 214 400 232"/>
          <path d="M-10 252C70 238 130 264 210 248S340 228 400 246"/>
        </g>
      </svg>
      <svg className="sway" viewBox="0 620 150 224" width="150" style={{ left: 0, bottom: 0 }}>
        <g stroke="#7A2418" strokeWidth="1.4"><path d="M40 844V722M78 844V690M112 844V744"/></g>
        <use href="#hg-lily" x="2" y="664" width="84" height="84"/>
        <use href="#hg-lily" x="44" y="632" width="76" height="76"/>
        <use href="#hg-lily" x="82" y="704" width="62" height="62" opacity=".85"/>
      </svg>
      <div className="kanji">漫画の書庫</div>
    </div>
  )
}
