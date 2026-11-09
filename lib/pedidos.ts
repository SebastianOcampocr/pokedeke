"use client";

import { crearAlmacen } from "./almacen";

export const ESTADOS = [
  "Pendiente de pago",
  "Pagado",
  "Pagado (PayPal)",
  "Conseguido",
  "Enviado",
  "Entregado",
  "Cancelado",
] as const;

export type Estado = (typeof ESTADOS)[number];

export type Pedido = {
  numero: string;
  fecha: string;
  cliente: string;
  telefono: string;
  correo: string;
  ubicacion: string;
  direccion: string;
  envio: string;
  lineas: { id: string; nombre: string; cantidad: number; precio: number }[];
  subtotal: number;
  descuento: number;
  costoEnvio: number;
  total: number;
  metodoPago: string;
  referencia: string;
  estado: Estado;
  guia: string;
  /** Solo la conoce quien hizo el pedido: permite mandar el comprobante. */
  clave?: string;
  /** Envío a una tienda fuera de la lista: el monto se confirma por WhatsApp. */
  envioPorWhatsApp?: boolean;
  /** Trae un pedido especial: todo se entrega después de `llegada`. */
  especial?: { llegada?: string };
};

const almacen = crearAlmacen<Pedido[]>("demo-pedidos-v3", () => [], []);

export const usePedidos = almacen.usar;

export function siguienteNumero(pedidos: Pedido[]) {
  return `TCG-${String(pedidos.length + 1).padStart(4, "0")}`;
}

export function guardarPedido(pedido: Pedido) {
  almacen.guardar((previos) => [...previos, pedido]);
}

export function actualizarPedido(numero: string, cambios: Partial<Pedido>) {
  almacen.guardar((previos) =>
    previos.map((pedido) =>
      pedido.numero === numero ? { ...pedido, ...cambios } : pedido,
    ),
  );
}
