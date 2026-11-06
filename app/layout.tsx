import type { Metadata, Viewport } from "next";
import { Bungee, Rubik } from "next/font/google";
import { Suspense } from "react";
import { AvisoLogro } from "@/components/AvisoLogro";
import { BarraInferior } from "@/components/BarraInferior";
import { DekeCompa } from "@/components/DekeCompa";
import { EfectosGlobales } from "@/components/EfectosGlobales";
import { Encabezado, PiePagina } from "@/components/Estructura";
import { TIENDA } from "@/lib/tienda";
import "./globals.css";

const bungee = Bungee({
  variable: "--font-bungee",
  weight: "400",
  subsets: ["latin", "latin-ext"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: `${TIENDA.nombre} · Cartas Pokémon en Costa Rica`,
    template: `%s · ${TIENDA.nombre}`,
  },
  description:
    "Demo de tienda en línea: sobres, cajas y cartas de Pokémon, en colones y con envío a todo Costa Rica.",
  // Es una demo con fotos de muestra: que no salga en los buscadores.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#FFCE1F",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CR"
      data-scroll-behavior="smooth"
      className={`${bungee.variable} ${rubik.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col pb-[calc(63px+env(safe-area-inset-bottom))] lg:pb-0">
        <Encabezado />
        <main className="flex grow flex-col">{children}</main>
        <PiePagina />
        <EfectosGlobales />
        <AvisoLogro />
        <Suspense fallback={null}>
          <BarraInferior />
          <DekeCompa />
        </Suspense>
      </body>
    </html>
  );
}
