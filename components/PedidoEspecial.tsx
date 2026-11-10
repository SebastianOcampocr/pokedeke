import { fechaLarga } from "@/lib/formato";

/**
 * Solo para pedidos viejos: los que se hicieron cuando había productos de
 * Estados Unidos pagados por adelantado siguen mostrando cuándo se entregan.
 * "después del 5 de diciembre", o "cuando llegue" si no quedó fecha.
 */
export function cuandoSeEntrega(llegada?: string) {
  return llegada ? `después del ${fechaLarga(llegada)}` : "cuando llegue";
}
