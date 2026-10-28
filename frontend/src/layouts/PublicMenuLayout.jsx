import { Outlet } from 'react-router';

/** Layout do cardápio público: coluna única, pensado primeiro para celulares. */
export function PublicMenuLayout() {
  return (
    <div className="min-h-dvh bg-stone-50">
      <div className="mx-auto w-full max-w-xl">
        <Outlet />
      </div>
    </div>
  );
}
