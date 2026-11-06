type Props = { tamano?: number };

function Base({
  tamano = 24,
  children,
}: Props & { children: React.ReactNode }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconoBuscar(props: Props) {
  return (
    <Base {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Base>
  );
}

export function IconoCarrito(props: Props) {
  return (
    <Base {...props}>
      <path d="M3 4h2l2.4 11h10.2L20 8H6.2" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </Base>
  );
}

export function IconoChat(props: Props) {
  return (
    <Base {...props}>
      <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.7-5.2A8.5 8.5 0 1 1 21 12z" />
    </Base>
  );
}

export function IconoBasurero(props: Props) {
  return (
    <Base {...props}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </Base>
  );
}

export function IconoCheque(props: Props) {
  return (
    <Base {...props}>
      <path d="M5 13l4 4L19 7" />
    </Base>
  );
}

export function IconoCorazon({
  tamano = 24,
  relleno = false,
}: Props & { relleno?: boolean }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill={relleno ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20.5s-8-4.9-8-11A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8 2.9c0 6.1-8 11-8 11z" />
    </svg>
  );
}

export function IconoInicio(props: Props) {
  return (
    <Base {...props}>
      <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />
    </Base>
  );
}

export function IconoCartas(props: Props) {
  return (
    <Base {...props}>
      <rect x="9" y="4" width="11" height="16" rx="2" />
      <path d="M5 7.5 3.8 8a1.5 1.5 0 0 0-.9 1.9l3.2 8.8" />
    </Base>
  );
}

export function IconoMas(props: Props) {
  return (
    <Base {...props}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function IconoEstante(props: Props) {
  return (
    <Base {...props}>
      <path d="M3 21h18M5 21V4h14v17M5 12h14M9 4v8M15 12v9" />
    </Base>
  );
}

export function IconoEquis(props: Props) {
  return (
    <Base {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Base>
  );
}
