/**
 * Elige la versión de cada foto para la página ya armada. Las miniaturas salen
 * de scripts/hacer-miniaturas.mjs. Lo que no sea una foto de producto, y el
 * tamaño más grande, se sirve tal cual.
 */
export default function cargadorDeFotos({
  src,
  width,
}: {
  src: string;
  width: number;
}) {
  const partes = src.match(/^(.*\/)productos\/([^/]+\.webp)$/);
  if (!partes || width > 640) return src;
  return `${partes[1]}miniaturas/${width}/${partes[2]}`;
}
