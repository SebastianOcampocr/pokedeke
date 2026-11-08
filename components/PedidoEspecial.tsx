import { fechaLarga } from "@/lib/formato";

/** "después del 5 de diciembre", o "cuando llegue" si la hoja no trae fecha. */
export function cuandoSeEntrega(llegada?: string) {
  return llegada ? `después del ${fechaLarga(llegada)}` : "cuando llegue";
}

/**
 * Las condiciones de un pedido especial. Son las mismas en la ficha, el pago y
 * la portada, y deben decir lo mismo que apps-script/Pedidos.gs y /politicas.
 */
export function condicionesPedidoEspecial(llegada?: string) {
  return [
    "Lo apartás pagando el 100% por SINPE Móvil.",
    `Lo traemos de Estados Unidos y se entrega ${cuandoSeEntrega(llegada)}.`,
    "Hacemos todo lo posible por traerlo, pero depende de la disponibilidad. Si por algo no lo podemos entregar, te avisamos por WhatsApp y te devolvemos el 100% de lo que pagaste, por SINPE Móvil a la misma cuenta.",
  ];
}

export function AvisoPedidoEspecial({
  llegada,
  titulo = "Pedido especial desde Estados Unidos",
  className = "",
}: {
  llegada?: string;
  titulo?: string;
  className?: string;
}) {
  return (
    <div className={`marco bg-crema p-3 ${className}`}>
      <p className="font-bold">{titulo}</p>
      <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-5 text-[15px] leading-snug">
        {condicionesPedidoEspecial(llegada).map((condicion) => (
          <li key={condicion}>{condicion}</li>
        ))}
      </ul>
    </div>
  );
}

/** La fecha más tardía entre los pedidos especiales de un carrito o pedido. */
export function llegadaDeEspeciales(llegadas: (string | undefined)[]) {
  return llegadas.filter(Boolean).sort().at(-1);
}
