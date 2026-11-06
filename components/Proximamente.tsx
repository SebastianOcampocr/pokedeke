import { BotonAvisame } from "./BotonAvisame";
import { Revelar } from "./Revelar";

const JUEGOS = ["One Piece", "Magic", "Lorcana", "Yu-Gi-Oh!"];

/** Los demás TCG: todavía no se venden, pero ya se puede pedir el aviso. */
export function Proximamente() {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-[22px] text-rojo md:text-3xl">
          Próximamente
        </h2>
        <p className="text-[15px] font-medium text-gris">
          Por ahora somos puro Pokémon. Estos juegos vienen en camino.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {JUEGOS.map((juego, indice) => (
          <Revelar key={juego} indice={indice}>
            <article className="marco relative flex h-full flex-col justify-between gap-4 border-dashed bg-gris-claro p-4">
              <h3 className="font-display text-xl leading-none text-azul">
                {juego}
              </h3>
              <BotonAvisame nombreProducto={juego} className="w-full" />
              <span className="calcomania -rotate-2 bg-azul">Pronto</span>
            </article>
          </Revelar>
        ))}
      </div>
    </section>
  );
}
