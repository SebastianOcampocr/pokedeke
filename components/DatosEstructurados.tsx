/**
 * Datos para buscadores (schema.org en JSON-LD): Google los lee para mostrar la
 * tienda y los productos con precio y disponibilidad. El `<` se escapa para que
 * ningún texto pueda cerrar la etiqueta.
 */
export function DatosEstructurados({ datos }: { datos: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(datos).replace(/</g, "\\u003c"),
      }}
    />
  );
}
