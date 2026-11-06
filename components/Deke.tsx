/**
 * Deke, la mascota de Pokedeke: una carta con patas que cuida el mezzanine.
 * Es un dibujo propio, sin personajes ni arte de ningún juego. Los ojos siguen
 * al puntero desde EfectosGlobales, que busca el atributo `data-deke`.
 */
export type AnimoDeke = "feliz" | "triste" | "guino" | "sorpresa";

function Ojo({ x }: { x: number }) {
  return (
    <>
      <circle cx={x} cy="62" r="7" fill="#141414" />
      <circle cx={x + 2.5} cy="59.5" r="2.4" fill="#FFFFFF" />
    </>
  );
}

export function Deke({
  animo = "feliz",
  className = "",
}: {
  animo?: AnimoDeke;
  className?: string;
}) {
  const trazo = {
    stroke: "#141414",
    strokeWidth: 5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  return (
    <svg
      viewBox="0 0 120 150"
      aria-hidden="true"
      data-deke=""
      className={className}
    >
      <path className="deke-pata" d="M46 126v15h-9" {...trazo} />
      <path className="deke-pata deke-pata-otra" d="M74 126v15h9" {...trazo} />
      <path d="M17 82Q6 80 7 68" {...trazo} />
      <g className={animo === "triste" ? undefined : "deke-brazo"}>
        <path d="M103 82Q114 76 113 58" {...trazo} />
      </g>
      <rect
        className="deke-cuerpo"
        x="16"
        y="10"
        width="88"
        height="118"
        rx="12"
        fill="#1437A8"
        stroke="#141414"
        strokeWidth="4"
      />
      <rect
        x="25"
        y="19"
        width="70"
        height="100"
        rx="7"
        fill="#FFCE1F"
        stroke="#141414"
        strokeWidth="3"
      />
      <g className="deke-mirada">
        <g className="deke-parpado">
          <Ojo x={46} />
          {animo === "guino" ? null : <Ojo x={74} />}
        </g>
      </g>
      {animo === "guino" ? <path d="M67 62q7-7 14 0" {...trazo} /> : null}
      {animo === "triste" ? <path d="M49 92q11-11 22 0" {...trazo} /> : null}
      {animo === "sorpresa" ? (
        <ellipse cx="60" cy="88" rx="7" ry="9" fill="#141414" />
      ) : null}
      {animo === "feliz" || animo === "guino" ? (
        <path d="M47 81q13 15 26 0" {...trazo} />
      ) : null}
    </svg>
  );
}

/** El dorso de las cartas de la tienda: Deke sobre azul, con raya amarilla. */
export function DorsoCarta({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 250 350" aria-hidden="true" className={className}>
      <rect width="250" height="350" rx="18" fill="#141414" />
      <rect x="9" y="9" width="232" height="332" rx="12" fill="#1437A8" />
      <rect
        x="24"
        y="24"
        width="202"
        height="302"
        rx="8"
        fill="none"
        stroke="#FFCE1F"
        strokeWidth="5"
        strokeDasharray="14 9"
      />
      <g transform="translate(65 96) scale(1)">
        <rect
          x="8"
          y="0"
          width="104"
          height="140"
          rx="14"
          fill="#FFCE1F"
          stroke="#141414"
          strokeWidth="5"
        />
        <circle cx="42" cy="58" r="9" fill="#141414" />
        <circle cx="78" cy="58" r="9" fill="#141414" />
        <path
          d="M40 86q20 22 40 0"
          stroke="#141414"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      <text
        x="125"
        y="282"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="26"
        fill="#FFCE1F"
      >
        POKEDEKE
      </text>
    </svg>
  );
}
