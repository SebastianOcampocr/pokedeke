"use client";

import { crearAlmacen } from "./almacen";

export const ESTADOS = [
  "Pendiente de pago",
  "Pagado",
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
};

const haceDias = (dias: number) =>
  new Date(Date.now() - dias * 86_400_000).toISOString();

function pedidosDeMuestra(): Pedido[] {
  return [
    {
      numero: "TCG-0001",
      fecha: haceDias(9),
      cliente: "Andrea Mora",
      telefono: "8888-0001",
      correo: "andrea@ejemplo.cr",
      ubicacion: "Heredia, Barva, San Pablo",
      direccion: "Frente al parque, casa azul",
      envio: "Correos de Costa Rica",
      lineas: [
        {
          id: "C002",
          nombre: "Booster Bundle Prismatic Evolutions",
          cantidad: 1,
          precio: 28500,
        },
      ],
      subtotal: 28500,
      descuento: 0,
      costoEnvio: 2500,
      total: 31000,
      metodoPago: "SINPE Móvil",
      referencia: "20261026-4471",
      estado: "Entregado",
      guia: "CR123456789",
    },
    {
      numero: "TCG-0002",
      fecha: haceDias(3),
      cliente: "Diego Solano",
      telefono: "8888-0002",
      correo: "diego@ejemplo.cr",
      ubicacion: "Edificio Omni, San José",
      direccion: "Retiro coordinado por WhatsApp",
      envio: "Retiro en Edificio Omni",
      lineas: [
        { id: "C010", nombre: "Charizard ex (carta suelta)", cantidad: 1, precio: 24000 },
        { id: "C012", nombre: "Dragon Shield Sleeves x100", cantidad: 2, precio: 5500 },
      ],
      subtotal: 35000,
      descuento: 0,
      costoEnvio: 0,
      total: 35000,
      metodoPago: "Transferencia bancaria",
      referencia: "0098-221",
      estado: "Enviado",
      guia: "",
    },
    {
      numero: "TCG-0003",
      fecha: haceDias(0),
      cliente: "Valeria Rojas",
      telefono: "8888-0003",
      correo: "valeria@ejemplo.cr",
      ubicacion: "Alajuela, San Ramón, Volio",
      direccion: "100 metros norte de la iglesia",
      envio: "Correos de Costa Rica",
      lineas: [
        { id: "C003", nombre: "Sobre Perfect Order", cantidad: 4, precio: 4500 },
      ],
      subtotal: 18000,
      descuento: 0,
      costoEnvio: 2500,
      total: 20500,
      metodoPago: "SINPE Móvil",
      referencia: "20261104-1180",
      estado: "Pagado",
      guia: "",
    },
    {
      numero: "TCG-0004",
      fecha: haceDias(0),
      cliente: "Marco Chaves",
      telefono: "8888-0004",
      correo: "marco@ejemplo.cr",
      ubicacion: "Cartago, La Unión, Tres Ríos",
      direccion: "Condominio Los Robles, casa 12",
      envio: "Correos de Costa Rica",
      lineas: [
        { id: "C001", nombre: "ETB Ascended Heroes", cantidad: 1, precio: 45000 },
      ],
      subtotal: 45000,
      descuento: 0,
      costoEnvio: 2500,
      total: 47500,
      metodoPago: "SINPE Móvil",
      referencia: "",
      estado: "Pendiente de pago",
      guia: "",
    },
  ];
}

const almacen = crearAlmacen<Pedido[]>("demo-pedidos-v2", pedidosDeMuestra, []);

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
