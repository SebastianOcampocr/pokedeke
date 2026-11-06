export type CajaMisteriosa = {
  slug: string;
  valorMinimo: number;
  trae: string[];
};

/** Lo que cada caja garantiza: esto es lo que se promete en la página. */
export const CAJAS_MISTERIOSAS: CajaMisteriosa[] = [
  {
    slug: "caja-misteriosa-chiquita",
    valorMinimo: 12000,
    trae: [
      "1 sobre sellado",
      "5 cartas sueltas, una de ellas holográfica",
      "1 detallito: stickers o sleeves",
    ],
  },
  {
    slug: "caja-misteriosa-mediana",
    valorMinimo: 30000,
    trae: [
      "3 sobres sellados",
      "1 carta rara",
      "1 accesorio: sleeves, toploaders o deck box",
    ],
  },
  {
    slug: "caja-misteriosa-grande",
    valorMinimo: 60000,
    trae: [
      "1 producto sellado: bundle o ETB",
      "2 cartas raras",
      "1 accesorio grande: álbum, playmat o deck box",
    ],
  },
];

export function buscarCajaMisteriosa(slug: string) {
  return CAJAS_MISTERIOSAS.find((caja) => caja.slug === slug);
}

/** Una Mediana de muestra, para enseñar cómo se saca la cuenta. */
export const EJEMPLO_MEDIANA = [
  { slug: "sobre-chaos-rising", cantidad: 3 },
  { slug: "mew-ex-carta-suelta", cantidad: 1 },
  { slug: "dragon-shield-sleeves-x100", cantidad: 1 },
];
