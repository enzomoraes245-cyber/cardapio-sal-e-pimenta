export function RestaurantStatusBadge({ status }) {
  const suspended = status === 'SUSPENDED';
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        suspended ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
      }`}
    >
      {suspended ? 'Suspenso' : 'Ativo'}
    </span>
  );
}
