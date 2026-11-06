import { colones } from "@/lib/formato";
import { ENVIO_GRATIS_DESDE } from "@/lib/tienda";
import { Deke } from "./Deke";

/** Deke camina hacia la meta conforme crece la compra. */
export function BarraEnvio({ subtotal }: { subtotal: number }) {
  const avance = Math.min((subtotal / ENVIO_GRATIS_DESDE) * 100, 100);
  const falta = ENVIO_GRATIS_DESDE - subtotal;

  return (
    <div className="marco bg-crema p-3">
      <p role="status" className="text-[15px] font-bold">
        {falta > 0
          ? `Te faltan ${colones(falta)} para que el envío por Correos vaya gratis`
          : "¡Listo! Tu envío por Correos va gratis"}
      </p>
      <div className="pista-envio">
        <div className="pista-avance" style={{ width: `${avance}%` }} />
        <span
          className={`pista-deke ${falta > 0 ? "deke-camina" : ""}`}
          style={{ left: `clamp(15px, ${avance}%, calc(100% - 15px))` }}
        >
          <Deke animo={falta > 0 ? "feliz" : "guino"} className="w-full" />
        </span>
      </div>
    </div>
  );
}
