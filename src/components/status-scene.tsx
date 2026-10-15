// Анимированные иллюстрации для страниц ошибок. Чистый SVG + CSS (см. globals.css),
// без библиотек; при «уменьшить движение» в настройках системы анимация отключается.

const stroke = "stroke-neutral-900";
const soft = "fill-neutral-100";

/** 404: лупа кружит вокруг карточки портфолио и не может её найти. */
export function LostScene() {
  return (
    <svg viewBox="0 0 240 190" className="w-48 sm:w-60" aria-hidden>
      <ellipse cx="120" cy="172" rx="46" ry="6" className="anim-shadow fill-neutral-200" />
      <g className="anim-float">
        <rect x="78" y="34" width="84" height="110" rx="10" className={`fill-white ${stroke}`} strokeWidth="2.5" />
        <circle cx="100" cy="60" r="10" className={soft} />
        <rect x="116" y="54" width="32" height="5" rx="2.5" className="fill-neutral-200" />
        <rect x="116" y="63" width="22" height="5" rx="2.5" className="fill-neutral-200" />
        <rect x="90" y="82" width="60" height="5" rx="2.5" className="fill-neutral-200" />
        <rect x="90" y="92" width="48" height="5" rx="2.5" className="fill-neutral-200" />
        <text x="120" y="130" textAnchor="middle" className="anim-blink fill-neutral-900 text-[22px] font-semibold">?</text>
      </g>
      <g className="anim-orbit">
        <g transform="translate(120 92)">
          <circle r="13" className={`fill-white/70 ${stroke}`} strokeWidth="3" />
          <line x1="9" y1="9" x2="20" y2="20" className={stroke} strokeWidth="4" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

/** Ошибка: вилка тянется к розетке, но искрит и не достаёт. */
export function BrokenScene() {
  return (
    <svg viewBox="0 0 240 160" className="w-48 sm:w-60" aria-hidden>
      <path d="M8 96 C 40 96, 50 70, 84 80" fill="none" className={stroke} strokeWidth="3" strokeLinecap="round" />
      <g className="anim-plug">
        <rect x="80" y="66" width="34" height="30" rx="7" className={`fill-white ${stroke}`} strokeWidth="2.5" />
        <line x1="114" y1="74" x2="126" y2="74" className={stroke} strokeWidth="4" strokeLinecap="round" />
        <line x1="114" y1="88" x2="126" y2="88" className={stroke} strokeWidth="4" strokeLinecap="round" />
      </g>
      <g className="anim-spark" style={{ animationDelay: "0.1s" }}>
        <path d="M142 62 l4 8 -6 2 5 9" fill="none" className="stroke-amber-500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className="anim-spark" style={{ animationDelay: "0.2s" }}>
        <path d="M140 96 l6 4 -5 4 7 3" fill="none" className="stroke-amber-500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <rect x="156" y="52" width="58" height="58" rx="12" className={`fill-white ${stroke}`} strokeWidth="2.5" />
      <rect x="172" y="70" width="5" height="10" rx="2" className="fill-neutral-900" />
      <rect x="193" y="70" width="5" height="10" rx="2" className="fill-neutral-900" />
      <path d="M176 94 q 9 -6 18 0" fill="none" className={stroke} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Нет интернета: волны сигнала гаснут над ноутбуком. */
export function OfflineScene() {
  return (
    <svg viewBox="0 0 240 170" className="w-48 sm:w-60" aria-hidden>
      {[0, 0.4, 0.8].map((delay, i) => (
        <path
          key={i}
          d={`M${120 - 18 - i * 16} ${62 - i * 12} q ${18 + i * 16} ${-16 - i * 6} ${36 + i * 32} 0`}
          fill="none"
          className="anim-wave stroke-neutral-400"
          strokeWidth="4"
          strokeLinecap="round"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
      <circle cx="120" cy="72" r="4" className="anim-blink fill-neutral-900" />
      <g className="anim-float">
        <rect x="66" y="90" width="108" height="56" rx="6" className={`fill-white ${stroke}`} strokeWidth="2.5" />
        <rect x="76" y="99" width="88" height="38" rx="3" className={soft} />
        <line x1="104" y1="110" x2="136" y2="126" className="stroke-neutral-400" strokeWidth="3" strokeLinecap="round" />
        <line x1="136" y1="110" x2="104" y2="126" className="stroke-neutral-400" strokeWidth="3" strokeLinecap="round" />
      </g>
      <rect x="52" y="148" width="136" height="7" rx="3.5" className="fill-neutral-900" />
    </svg>
  );
}
