"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useState } from "react";
import ubicaciones from "@/datos/ubicaciones-cr.json";
import { useHidratado } from "@/lib/almacen";
import { useCarrito, vaciarCarrito } from "@/lib/carrito";
import { lanzarConfeti } from "@/lib/confeti";
import { calcularTotales, colones } from "@/lib/formato";
import { ganarLogro } from "@/lib/logros";
import {
  actualizarPedido,
  guardarPedido,
  siguienteNumero,
  usePedidos,
  type Pedido,
} from "@/lib/pedidos";
import {
  costoDeEnvio,
  enlaceWhatsApp,
  ENVIO_GRATIS_DESDE,
  ENVIOS,
  LUGAR,
  TIENDA,
} from "@/lib/tienda";
import { Deke } from "./Deke";
import { IconoChat, IconoCheque } from "./Iconos";
import { CarritoVacio, Linea } from "./VistaCarrito";

const METODOS = ["SINPE Móvil", "Transferencia bancaria"];

function Campo({
  id,
  rotulo,
  tipo = "text",
  autoCompletar,
}: {
  id: string;
  rotulo: string;
  tipo?: string;
  autoCompletar?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="rotulo-campo">
        {rotulo}
      </label>
      <input
        id={id}
        name={id}
        type={tipo}
        autoComplete={autoCompletar}
        className="campo"
        required
      />
    </div>
  );
}

function SelectorUbicacion({
  id,
  rotulo,
  valor,
  opciones,
  alCambiar,
}: {
  id: string;
  rotulo: string;
  valor: string;
  opciones: string[];
  alCambiar: (valor: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="rotulo-campo">
        {rotulo}
      </label>
      <select
        id={id}
        className="campo"
        required
        disabled={opciones.length === 0}
        value={valor}
        onChange={(evento) => alCambiar(evento.target.value)}
      >
        <option value="">Elegí una opción</option>
        {opciones.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
    </div>
  );
}

function Opcion({
  grupo,
  activa,
  titulo,
  detalle,
  extra,
  alElegir,
}: {
  grupo: string;
  activa: boolean;
  titulo: string;
  detalle?: string;
  extra?: string;
  alElegir: () => void;
}) {
  return (
    <label
      className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-md border-2 border-tinta p-3 ${
        activa ? "bg-crema" : "bg-white"
      }`}
    >
      <input
        type="radio"
        name={grupo}
        checked={activa}
        onChange={alElegir}
        className="size-5 accent-azul"
      />
      <span className="flex grow flex-col">
        <span className="font-bold">{titulo}</span>
        {detalle ? <span className="text-sm text-gris">{detalle}</span> : null}
      </span>
      {extra ? <span className="font-extrabold whitespace-nowrap">{extra}</span> : null}
    </label>
  );
}

function Bloque({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 font-display text-[22px] text-rojo">{titulo}</legend>
      {children}
    </fieldset>
  );
}

function SubirFoto() {
  const [archivo, setArchivo] = useState("");

  return (
    <div>
      <span className="rotulo-campo">O subí la foto (opcional)</span>
      <label className="boton boton-amarillo boton-chico w-full focus-within:outline-3 focus-within:outline-azul">
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(evento) =>
            setArchivo(evento.target.files?.[0]?.name ?? "")
          }
        />
        <span className="truncate">{archivo || "Elegir foto"}</span>
      </label>
    </div>
  );
}

function Confirmacion({ pedido }: { pedido: Pedido }) {
  const [referencia, setReferencia] = useState("");
  const [enviado, setEnviado] = useState(false);
  const esSinpe = pedido.metodoPago === "SINPE Móvil";

  useEffect(() => lanzarConfeti(), []);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="marco shadow-dura flex items-center gap-4 bg-crema p-5">
        <Deke animo="guino" className="deke h-24 shrink-0" />
        <div className="flex min-w-0 flex-col gap-2 overflow-x-clip">
          <p className="sello font-display text-2xl leading-tight text-azul">
            Pedido {pedido.numero} recibido
          </p>
          <p className="leading-snug">
            Gracias, {pedido.cliente.split(" ")[0]}. Tu producto queda apartado{" "}
            {TIENDA.plazoPagoHoras} horas mientras hacés el pago.
          </p>
        </div>
      </div>

      <div className="marco flex flex-col gap-2 p-5">
        <p className="font-bold">
          {esSinpe ? "Hacé el SINPE Móvil por:" : "Hacé la transferencia por:"}
        </p>
        <p className="text-4xl font-extrabold text-azul">
          {colones(pedido.total)}
        </p>
        <p className="mt-1">
          {esSinpe ? (
            <>
              Al número <strong>{TIENDA.sinpe}</strong>, a nombre de{" "}
              {TIENDA.sinpeTitular}.
            </>
          ) : (
            <>
              A la cuenta <strong>{TIENDA.cuentaIban}</strong>, a nombre de{" "}
              {TIENDA.sinpeTitular}.
            </>
          )}
        </p>
        <p className="text-sm text-gris">
          Son datos de muestra: en esta demo no pagués nada.
        </p>
      </div>

      {enviado ? (
        <p
          role="status"
          className="marco flex items-center gap-3 bg-white p-4 font-bold text-verde-oscuro"
        >
          <IconoCheque />
          Recibimos tu comprobante. Apenas lo revisemos te avisamos.
        </p>
      ) : (
        <form
          className="marco flex flex-col gap-3 p-5"
          onSubmit={(evento) => {
            evento.preventDefault();
            actualizarPedido(pedido.numero, { referencia });
            setEnviado(true);
          }}
        >
          <div>
            <label htmlFor="referencia" className="rotulo-campo">
              Número de comprobante
            </label>
            <input
              id="referencia"
              className="campo"
              required
              value={referencia}
              onChange={(evento) => setReferencia(evento.target.value)}
            />
          </div>
          <SubirFoto />
          <button type="submit" className="boton boton-rojo">
            Ya pagué
          </button>
          <a
            href={enlaceWhatsApp(
              `¡Hola! Ya pagué el pedido ${pedido.numero} por ${colones(pedido.total)}. Aquí va el comprobante.`,
            )}
            target="_blank"
            rel="noreferrer"
            className="boton boton-blanco boton-chico"
          >
            <IconoChat tamano={18} />
            Mandar el comprobante por WhatsApp
          </a>
        </form>
      )}

      <Link
        href={`/pedido?numero=${pedido.numero}`}
        className="boton boton-amarillo"
      >
        Ver el estado de mi pedido
      </Link>
    </div>
  );
}

export function Pago() {
  const hidratado = useHidratado();
  const { lineas, cupon } = useCarrito();
  const pedidos = usePedidos();
  const [envioId, setEnvioId] = useState(ENVIOS[0].id);
  const [metodo, setMetodo] = useState(METODOS[0]);
  const [provincia, setProvincia] = useState("");
  const [canton, setCanton] = useState("");
  const [distrito, setDistrito] = useState("");
  const [confirmado, setConfirmado] = useState<Pedido | null>(null);

  // Next deja viva esta página al navegar: sin esto, la siguiente compra
  // mostraría la confirmación del pedido anterior en vez del formulario.
  useLayoutEffect(() => () => setConfirmado(null), []);

  if (confirmado) return <Confirmacion pedido={confirmado} />;
  if (!hidratado) return <p>Cargando…</p>;
  if (lineas.length === 0) return <CarritoVacio />;

  const envio = ENVIOS.find((opcion) => opcion.id === envioId) ?? ENVIOS[0];
  const { subtotal } = calcularTotales(lineas, cupon, 0);
  const totales = calcularTotales(
    lineas,
    cupon,
    costoDeEnvio(envio.costo, subtotal),
  );
  const datosProvincia = ubicaciones.find((p) => p.nombre === provincia);
  const datosCanton = datosProvincia?.cantones.find((c) => c.nombre === canton);

  function hacerPedido(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const texto = (campo: string) => String(datos.get(campo) ?? "").trim();
    const pedido: Pedido = {
      numero: siguienteNumero(pedidos),
      fecha: new Date().toISOString(),
      cliente: texto("nombre"),
      telefono: texto("telefono"),
      correo: texto("correo"),
      ubicacion: envio.pideDireccion
        ? [provincia, canton, distrito].join(", ")
        : `${LUGAR.nombre}, San José`,
      direccion: texto("direccion") || "Retiro coordinado por WhatsApp",
      envio: envio.nombre,
      lineas: lineas.map(({ producto, cantidad, precio }) => ({
        id: producto.id,
        nombre: producto.nombre,
        cantidad,
        precio,
      })),
      subtotal: totales.subtotal,
      descuento: totales.descuento,
      costoEnvio: totales.envio,
      total: totales.total,
      metodoPago: metodo,
      referencia: "",
      estado: "Pendiente de pago",
      guia: "",
    };
    guardarPedido(pedido);
    vaciarCarrito();
    ganarLogro("pedido");
    setProvincia("");
    setCanton("");
    setDistrito("");
    setConfirmado(pedido);
    window.scrollTo({ top: 0 });
  }

  return (
    <form
      onSubmit={hacerPedido}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start"
    >
      <div className="flex flex-col gap-8">
        <Bloque titulo="Tus datos">
          <Campo id="nombre" rotulo="Nombre completo" autoCompletar="name" />
          <Campo
            id="telefono"
            rotulo="Teléfono o WhatsApp"
            tipo="tel"
            autoCompletar="tel"
          />
          <Campo id="correo" rotulo="Correo" tipo="email" autoCompletar="email" />
        </Bloque>

        <Bloque titulo="Cómo te llega">
          {ENVIOS.map((opcion) => (
            <Opcion
              key={opcion.id}
              grupo="envio"
              activa={opcion.id === envio.id}
              titulo={opcion.nombre}
              detalle={opcion.detalle}
              extra={
                costoDeEnvio(opcion.costo, subtotal) === 0
                  ? "Gratis"
                  : colones(opcion.costo)
              }
              alElegir={() => setEnvioId(opcion.id)}
            />
          ))}
          {subtotal >= ENVIO_GRATIS_DESDE ? (
            <p className="text-sm font-bold text-verde-oscuro">
              Tu compra pasa de {colones(ENVIO_GRATIS_DESDE)}: el envío va por
              nuestra cuenta.
            </p>
          ) : null}

          {envio.pideDireccion ? (
            <div className="mt-2 flex flex-col gap-3">
              <SelectorUbicacion
                id="provincia"
                rotulo="Provincia"
                valor={provincia}
                opciones={ubicaciones.map((p) => p.nombre)}
                alCambiar={(valor) => {
                  setProvincia(valor);
                  setCanton("");
                  setDistrito("");
                }}
              />
              <SelectorUbicacion
                id="canton"
                rotulo="Cantón"
                valor={canton}
                opciones={datosProvincia?.cantones.map((c) => c.nombre) ?? []}
                alCambiar={(valor) => {
                  setCanton(valor);
                  setDistrito("");
                }}
              />
              <SelectorUbicacion
                id="distrito"
                rotulo="Distrito"
                valor={distrito}
                opciones={datosCanton?.distritos ?? []}
                alCambiar={setDistrito}
              />
              <Campo id="direccion" rotulo="Dirección exacta" />
            </div>
          ) : null}
        </Bloque>

        <Bloque titulo="Cómo pagás">
          {METODOS.map((opcion) => (
            <Opcion
              key={opcion}
              grupo="pago"
              activa={opcion === metodo}
              titulo={opcion}
              alElegir={() => setMetodo(opcion)}
            />
          ))}
          <div className="flex min-h-14 items-center justify-between gap-3 rounded-md border-2 border-dashed border-gris p-3 text-gris">
            <span className="font-bold">Tarjeta</span>
            <span className="text-sm">Muy pronto</span>
          </div>
        </Bloque>
      </div>

      <aside className="marco shadow-dura flex flex-col gap-3 p-4 lg:sticky lg:top-24">
        <h2 className="font-display text-xl text-azul">Tu pedido</h2>
        <ul className="flex flex-col gap-2 text-[15px]">
          {lineas.map(({ producto, cantidad, precio }) => (
            <li key={producto.slug} className="flex justify-between gap-3">
              <span className="min-w-0">
                {cantidad} × {producto.nombre}
              </span>
              <span className="whitespace-nowrap">
                {colones(precio * cantidad)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-1.5 border-t-2 border-tinta pt-3">
          <Linea rotulo="Subtotal" monto={colones(totales.subtotal)} />
          {totales.descuento > 0 ? (
            <Linea
              rotulo={`Cupón ${cupon?.codigo}`}
              monto={`−${colones(totales.descuento)}`}
            />
          ) : null}
          <Linea
            rotulo="Envío"
            monto={totales.envio === 0 ? "Gratis" : colones(totales.envio)}
          />
          <Linea rotulo="Total" monto={colones(totales.total)} fuerte />
        </div>
        <button type="submit" className="boton boton-rojo">
          Hacer el pedido
        </button>
        <p className="text-sm leading-snug text-gris">
          Tu producto queda apartado {TIENDA.plazoPagoHoras} horas. Al seguir
          aceptás los{" "}
          <Link href="/politicas#terminos" className="underline">
            términos
          </Link>{" "}
          y la{" "}
          <Link href="/politicas#privacidad" className="underline">
            política de privacidad
          </Link>
          .
        </p>
      </aside>
    </form>
  );
}
