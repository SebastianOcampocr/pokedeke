"use client";

const estiloBoton =
  "flex size-11 items-center justify-center text-xl font-extrabold disabled:text-gris-medio disabled:cursor-not-allowed";

export function Cantidad({
  valor,
  maximo,
  minimo = 1,
  nombre,
  alCambiar,
}: {
  valor: number;
  maximo: number;
  minimo?: number;
  nombre: string;
  alCambiar: (valor: number) => void;
}) {
  return (
    <div
      role="group"
      aria-label={`Cantidad de ${nombre}`}
      className="inline-flex items-center rounded-md border-2 border-tinta bg-white"
    >
      <button
        type="button"
        aria-label="Quitar uno"
        className={estiloBoton}
        disabled={valor <= minimo}
        onClick={() => alCambiar(valor - 1)}
      >
        −
      </button>
      <span aria-live="polite" className="min-w-8 text-center font-extrabold">
        {valor}
      </span>
      <button
        type="button"
        aria-label="Agregar uno"
        className={estiloBoton}
        disabled={valor >= maximo}
        onClick={() => alCambiar(valor + 1)}
      >
        +
      </button>
    </div>
  );
}
