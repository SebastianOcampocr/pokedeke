import { fechaLarga } from "@/lib/formato";
import { TIENDA } from "@/lib/tienda";

/** "a más tardar el 5 de diciembre", o "cuando llegue" si no quedó fecha. */
export function cuandoSeEntrega(llegada?: string) {
  if (!llegada) return "cuando llegue";
  // "2026-12-20" sola se leería como medianoche en Londres, que en Costa Rica es el día anterior.
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(llegada) ? llegada + "T12:00:00-06:00" : llegada;
  return `a más tardar el ${fechaLarga(fecha)}`;
}

/** Debe ser igual a CONDICIONES_ESPECIAL en apps-script/Pedidos.gs: sube si cambian las condiciones. */
export const CONDICIONES_ESPECIAL = "condiciones-2026-11-10";

/**
 * Las condiciones del pedido especial con pago anticipado. Son las mismas en la
 * ficha y en el pago, y la persona las acepta antes de pagar.
 */
export function condicionesPedidoEspecial(version: string, entrega?: string) {
  return [
    "No lo tenemos en el mezzanine: lo importamos de Estados Unidos solo para vos, cuando entra tu pago.",
    "Pagás el 100% por adelantado, por SINPE Móvil o con tarjeta.",
    `Es la versión exacta que escogiste: ${version}. No se cambia por otra.`,
    `Te lo entregamos ${cuandoSeEntrega(entrega)}. Te vamos contando por WhatsApp cómo va.`,
    "Si no lo conseguimos, el proveedor cancela o no llega a esa fecha, te devolvemos el 100% de lo que pagaste, por el mismo medio y sin rebajos.",
    "Podés cancelarlo dentro de los 8 días hábiles desde que pagaste y te devolvemos todo.",
    `Para reclamos o devoluciones: WhatsApp ${TIENDA.sinpe} o ${TIENDA.correo}.`,
  ];
}

export function CondicionesEspeciales({
  version,
  entrega,
  className = "",
}: {
  version: string;
  entrega?: string;
  className?: string;
}) {
  return (
    <ul className={`flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-snug ${className}`}>
      {condicionesPedidoEspecial(version, entrega).map((condicion) => (
        <li key={condicion}>{condicion}</li>
      ))}
    </ul>
  );
}
