import { useId } from "react";

/** El sobre de la tienda: dibujo propio, con Deke y rayos de rótulo. */
export function SobreDibujo({ className = "" }: { className?: string }) {
  const forma = useId();
  const rayos = Array.from({ length: 12 }, (_, indice) => indice * 30);

  return (
    <svg viewBox="0 0 200 300" aria-hidden="true" className={className}>
      <defs>
        <clipPath id={forma}>
          <path d="M6 6l9 7 9-7 9 7 9-7 9 7 9-7 9 7 9-7 9 7 9-7 9 7 9-7 9 7 9-7 9 7 9-7 9 7 9-7 9 7 8-7v288l-9-7-9 7-9-7-9 7-9-7-9 7-9-7-9 7-9-7-9 7-9-7-9 7-9-7-9 7-9-7-9 7-9-7-9 7-9-7-9 7-8 7z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${forma})`}>
        <rect width="200" height="300" fill="#1437A8" />
        <g transform="translate(100 150)">
          {rayos.map((giro) => (
            <path
              key={giro}
              d="M0 0L-30 -260L30 -260Z"
              fill="#FFCE1F"
              opacity="0.92"
              transform={`rotate(${giro})`}
            />
          ))}
        </g>
        <rect y="0" width="200" height="42" fill="#C8201A" />
        <rect y="258" width="200" height="42" fill="#C8201A" />
        <path d="M0 42h200M0 258h200" stroke="#141414" strokeWidth="4" />
      </g>
      <g transform="translate(54 84) scale(0.78)">
        <rect
          x="4"
          y="0"
          width="110"
          height="150"
          rx="14"
          fill="#fff"
          stroke="#141414"
          strokeWidth="6"
        />
        <rect
          x="15"
          y="11"
          width="88"
          height="128"
          rx="8"
          fill="#FFCE1F"
          stroke="#141414"
          strokeWidth="4"
        />
        <circle cx="42" cy="62" r="9" fill="#141414" />
        <circle cx="76" cy="62" r="9" fill="#141414" />
        <circle cx="45" cy="59" r="3" fill="#fff" />
        <circle cx="79" cy="59" r="3" fill="#fff" />
        <path
          d="M40 90q19 20 38 0"
          stroke="#141414"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      <text
        x="100"
        y="29"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="21"
        fill="#fff"
      >
        POKEDEKE
      </text>
      <text
        x="100"
        y="285"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="15"
        fill="#FFCE1F"
      >
        SOBRE DEL DÍA
      </text>
    </svg>
  );
}
