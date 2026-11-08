"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { consultarPedido, type PedidoPublico } from "@/lib/api-pedidos";
import { colones } from "@/lib/formato";
import { usePedidos, type Estado } from "@/lib/pedidos";
import { TIENDA_ABIERTA } from "@/lib/tienda";
import { Deke } from "./Deke";
import { IconoCheque } from "./Iconos";
import { cuandoSeEntrega } from "./PedidoEspecial";

const PASOS: { estado: Estado; texto: string }[] = [
  { estado: "Pendiente de pago", texto: "Estamos esperando tu pago" },
  { estado: "Pagado", texto: "Recibimos tu pago" },
  {
    estado: "Conseguido",
    texto: "Ya tenemos tu producto de Estados Unidos: pronto está listo para entregar",
  },
  { estado: "Enviado", texto: "Tu pedido va en camino" },
  { estado: "Entregado", texto: "Ya lo tenés en tus manos" },
];

function Seguimiento({ pedido }: { pedido: PedidoPublico }) {
  // "Conseguido" es solo de los pedidos especiales.
  const pasos =
    pedido.especial || pedido.estado === "Conseguido"
      ? PASOS
      : PASOS.filter((paso) => paso.estado !== "Conseguido");
  const actual = pasos.findIndex((paso) => paso.estado === pedido.estado);

  return (
    <div className="marco shadow-dura flex flex-col gap-5 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-2xl text-azul">{pedido.numero}</h2>
        <p className="text-xl font-extrabold">{colones(pedido.total)}</p>
      </div>

      {pedido.estado === "Cancelado" ? (
        <p className="rounded-md bg-gris-claro p-3 font-bold">
          Este pedido se canceló. Si creés que es un error, escribinos.
        </p>
      ) : (
        <ol className="flex flex-col">
          {pasos.map((paso, indice) => {
            // Mientras no paguen, el primer paso espera: todavía no va con cheque.
            const hecho =
              indice <= actual && pedido.estado !== "Pendiente de pago";
            const esperando = indice === actual && !hecho;
            return (
              <li key={paso.estado} className="flex gap-3">
                <div className="ml-8 flex flex-col items-center">
                  <span
                    style={{ animationDelay: `${indice * 110}ms` }}
                    className={`saltar relative flex size-9 shrink-0 items-center justify-center rounded-full border-3 border-tinta ${
                      hecho
                        ? "bg-verde text-white"
                        : esperando
                          ? "bg-amarillo"
                          : "bg-white"
                    }`}
                  >
                    {hecho ? <IconoCheque tamano={18} /> : null}
                    {indice === actual ? (
                      <Deke className="deke absolute top-1/2 -left-9 h-10 -translate-y-1/2" />
                    ) : null}
                  </span>
                  {indice < pasos.length - 1 ? (
                    <span className="h-7 w-[3px] bg-tinta" />
                  ) : null}
                </div>
                <div className={indice === actual ? "pt-0.5" : "pt-1.5"}>
                  <p className={indice === actual ? "font-extrabold" : "text-gris"}>
                    {paso.estado}
                  </p>
                  {indice === actual ? (
                    <p className="text-sm">{paso.texto}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {pedido.especial ? (
        <p>
          Trae productos de Estados Unidos: se entrega{" "}
          <strong>{pedido.especial}</strong>.
        </p>
      ) : null}

      {pedido.guia ? (
        <p>
          Número de guía: <strong>{pedido.guia}</strong>
        </p>
      ) : null}

      <div className="border-t-2 border-tinta pt-3 text-[15px]">
        <p className="font-bold">{pedido.envio}</p>
        <ul className="mt-1">
          {pedido.lineas.map((linea) => (
            <li key={linea.nombre}>
              {linea.cantidad} × {linea.nombre}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function EstadoPedido({ numeroInicial = "" }: { numeroInicial?: string }) {
  const pedidos = usePedidos();
  const [numero, setNumero] = useState(numeroInicial);
  const [whatsapp, setWhatsapp] = useState("");
  const [hallado, setHallado] = useState<PedidoPublico | null>(null);
  const [error, setError] = useState("");
  const [buscando, setBuscando] = useState(false);

  async function buscar(numeroBuscado: string, numeroWhatsapp: string) {
    const limpio = numeroBuscado.trim().toUpperCase();
    setError("");
    setHallado(null);

    if (!TIENDA_ABIERTA) {
      const local = pedidos.find((opcion) => opcion.numero === limpio);
      if (local) {
        setHallado({
          ...local,
          especial: local.especial
            ? cuandoSeEntrega(local.especial.llegada)
            : undefined,
        });
      } else {
        setError("No hallamos ese pedido. Revisá el número e intentá otra vez.");
      }
      return;
    }

    setBuscando(true);
    const respuesta = await consultarPedido(limpio, numeroWhatsapp);
    setBuscando(false);
    if (respuesta.ok) setHallado(respuesta.pedido);
    else setError(respuesta.error);
  }

  // Quien llega desde su confirmación ya tiene el pedido en este navegador.
  const propio = pedidos.find((opcion) => opcion.numero === numeroInicial);
  const whatsappPropio = propio?.telefono;
  useEffect(() => {
    if (!numeroInicial || !whatsappPropio) return;
    setWhatsapp(whatsappPropio);
    void buscar(numeroInicial, whatsappPropio);
    // Solo al llegar: después manda el botón.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numeroInicial, whatsappPropio]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <form
        className="flex flex-col gap-3"
        onSubmit={(evento) => {
          evento.preventDefault();
          void buscar(numero, whatsapp);
        }}
      >
        <div>
          <label htmlFor="numero" className="rotulo-campo">
            Número de pedido
          </label>
          <input
            id="numero"
            className="campo uppercase"
            placeholder="TCG-0001"
            required
            value={numero}
            onChange={(evento) => setNumero(evento.target.value)}
          />
        </div>
        <div>
          <label htmlFor="whatsapp-pedido" className="rotulo-campo">
            WhatsApp
          </label>
          <input
            id="whatsapp-pedido"
            type="tel"
            className="campo"
            required={TIENDA_ABIERTA}
            value={whatsapp}
            onChange={(evento) => setWhatsapp(evento.target.value)}
          />
        </div>
        <button type="submit" className="boton boton-rojo" disabled={buscando}>
          {buscando ? "Buscando…" : "Ver mi pedido"}
        </button>
      </form>

      {hallado ? <Seguimiento pedido={hallado} /> : null}
      {error ? (
        <p role="alert" className="marco bg-crema p-4 font-bold">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function EstadoPedidoDesdeEnlace() {
  const parametros = useSearchParams();
  const numero = parametros.get("numero") ?? "";
  return <EstadoPedido key={numero} numeroInicial={numero} />;
}
