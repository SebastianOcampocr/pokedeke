"use client";

import { useEffect } from "react";
import { contarVisita } from "@/lib/api-pedidos";
import { anotarVisto, useVistos } from "@/lib/vistos";
import { useAgotadosAlFinal } from "@/lib/vivo";
import { TarjetaProducto } from "./TarjetaProducto";

export function VistosRecientes({ slug }: { slug: string }) {
  const vistos = useAgotadosAlFinal(useVistos(slug).slice(0, 4));

  useEffect(() => {
    anotarVisto(slug);
    contarVisita(slug, "vista");
  }, [slug]);

  if (vistos.length === 0) return null;

  return (
    <section className="flex flex-col gap-5">
      <h2 className="font-display text-[22px] text-rojo">Lo que venías viendo</h2>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {vistos.map((producto) => (
          <TarjetaProducto
            key={producto.slug}
            producto={producto}
            viaja={false}
          />
        ))}
      </div>
    </section>
  );
}
