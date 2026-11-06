"use client";

import { useSyncExternalStore } from "react";

/**
 * Guardado en el navegador para la demo. Sirve para que el carrito y los
 * pedidos de muestra sobrevivan a una recarga, sin servidor ni base de datos.
 */
export function crearAlmacen<T>(
  clave: string,
  valorInicial: () => T,
  valorServidor: T,
) {
  let actual: T | undefined;
  const oyentes = new Set<() => void>();

  function leer(): T {
    if (actual !== undefined) return actual;
    try {
      const guardado = window.localStorage.getItem(clave);
      actual = guardado ? (JSON.parse(guardado) as T) : valorInicial();
    } catch {
      actual = valorInicial();
    }
    return actual;
  }

  function avisar() {
    oyentes.forEach((oyente) => oyente());
  }

  function alCambiarOtraPestana(evento: StorageEvent) {
    if (evento.key !== clave) return;
    actual = undefined;
    avisar();
  }

  function suscribir(oyente: () => void) {
    if (oyentes.size === 0) {
      window.addEventListener("storage", alCambiarOtraPestana);
    }
    oyentes.add(oyente);
    return () => {
      oyentes.delete(oyente);
      if (oyentes.size === 0) {
        window.removeEventListener("storage", alCambiarOtraPestana);
      }
    };
  }

  return {
    leer,
    usar() {
      return useSyncExternalStore(suscribir, leer, () => valorServidor);
    },
    guardar(cambio: (previo: T) => T) {
      actual = cambio(leer());
      try {
        window.localStorage.setItem(clave, JSON.stringify(actual));
      } catch {
        // Sin espacio o en modo privado: la demo sigue funcionando en memoria.
      }
      avisar();
    },
  };
}

const suscribirNada = () => () => {};

/** Falso mientras se muestra el HTML inicial; verdadero ya en el navegador. */
export function useHidratado() {
  return useSyncExternalStore(
    suscribirNada,
    () => true,
    () => false,
  );
}
