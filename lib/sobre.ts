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

export const CARTAS_POR_SOBRE = 5;

/** Solo cartas con stock: lo que sale en el sobre se puede comprar. */
export const cartasDelSobre = () =>
  cartasSueltas().filter((carta) => !estaAgotado(carta));

/**
 * Arma un sobre con cartas que de verdad están en el catálogo, de menor a
 * mayor precio para cerrar con la mejor. Si hay pocas, trae las que haya. La
 * joya es la carta más cara de la tienda. El primer sobre siempre trae cupón,
 * para que nadie se quede sin ver el premio; después, uno de cada tres.
 */
export function abrirSobre(sobresAbiertos: number): ResultadoSobre {
  const disponibles = cartasDelSobre();
  const baraja = [...disponibles];
  const cartas: Producto[] = [];
  while (cartas.length < CARTAS_POR_SOBRE && baraja.length > 0) {
    cartas.push(sacar(baraja));
  }
  cartas.sort((a, b) => a.precio - b.precio);
  const joya =
    disponibles.length > CARTAS_POR_SOBRE &&
    cartas.at(-1) === disponibles.at(-1);

  return {
    cartas,
    joya,
    premio: sobresAbiertos === 0 || Math.random() < 1 / 3,
  };
}
