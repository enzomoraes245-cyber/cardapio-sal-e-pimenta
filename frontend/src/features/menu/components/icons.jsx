/** Ícones de traço do cardápio público (24×24, herdam a cor do texto). */
function Icon({ size = 20, strokeWidth = 1.8, fill = 'none', children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function HeartIcon({ filled = false, size }) {
  return (
    <Icon size={size} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </Icon>
  );
}

export function MenuIcon({ size = 22 }) {
  return (
    <Icon size={size}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </Icon>
  );
}

export function BackIcon({ size = 20 }) {
  return (
    <Icon size={size} strokeWidth={2}>
      <path d="M15 5l-7 7 7 7" />
    </Icon>
  );
}

export function SearchIcon({ size = 18 }) {
  return (
    <Icon size={size} strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Icon>
  );
}
