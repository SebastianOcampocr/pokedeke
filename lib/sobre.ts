import { cartasSueltas, estaAgotado, type Producto } from "./productos";

export const CUPON_SOBRE = "SOBRE5";

export type ResultadoSobre = {
  cartas: Producto[];
  /** La carta buena del sobre: va de última para cerrar con emoción. */
  joya: boolean;
  premio: boolean;
};

function sacar(lista: Producto[]) {
  const indice = Math.floor(Math.random() * lista.length);
  return lista.splice(indice, 1)[0];
}

/**
 * Arma un sobre con cartas que de verdad están en el catálogo: tres baratas,
 * una media y la última puede ser una joya. El primer sobre siempre trae
 * cupón, para que nadie se quede sin ver el premio; después, uno de cada tres.
 */
export function abrirSobre(sobresAbiertos: number): ResultadoSobre {
  const disponibles = cartasSueltas().filter((carta) => !estaAgotado(carta));
  const baratas = disponibles.filter((carta) => carta.precio < 35000);
  const medias = disponibles.filter(
    (carta) => carta.precio >= 35000 && carta.precio < 100000,
  );
  const caras = disponibles.filter((carta) => carta.precio >= 100000);

  const joya = Math.random() < 0.2;
  const cartas = [
    sacar(baratas),
    sacar(baratas),
    sacar(baratas),
    sacar(medias),
    joya ? sacar(caras) : sacar(medias),
  ];

  return {
    cartas,
    joya,
    premio: sobresAbiertos === 0 || Math.random() < 1 / 3,
  };
}
