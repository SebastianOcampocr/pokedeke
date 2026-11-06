type Paso = { titulo: string; texto: string };
type Pregunta = { pregunta: string; respuesta: string };

/** Los pasos numerados que explican cómo sirve una función de la tienda. */
export function Pasos({ titulo, pasos }: { titulo: string; pasos: Paso[] }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-[22px] text-rojo md:text-3xl">{titulo}</h2>
      <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {pasos.map((paso, indice) => (
          <li key={paso.titulo} className="marco flex gap-3 p-3">
            <span className="flex size-10 shrink-0 -rotate-3 items-center justify-center rounded-md border-2 border-tinta bg-azul font-display text-xl text-white">
              {indice + 1}
            </span>
            <div>
              <h3 className="font-extrabold">{paso.titulo}</h3>
              <p className="text-[15px] leading-snug">{paso.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Preguntas({
  titulo,
  preguntas,
}: {
  titulo: string;
  preguntas: Pregunta[];
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-[22px] text-rojo md:text-3xl">{titulo}</h2>
      {preguntas.map((item) => (
        <details key={item.pregunta} className="pregunta marco">
          <summary>{item.pregunta}</summary>
          <p>{item.respuesta}</p>
        </details>
      ))}
    </section>
  );
}
