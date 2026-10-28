export function MenuHeader({ restaurant }) {
  return (
    <header className="bg-brand px-4 pt-8 pb-6 text-white">
      <div className="flex items-center gap-4">
        {restaurant.logoUrl && (
          <img
            src={restaurant.logoUrl}
            alt={`Logotipo de ${restaurant.name}`}
            className="size-16 shrink-0 rounded-full bg-white object-cover"
          />
        )}
        <div className="min-w-0">
          <p className="text-sm opacity-80">Cardápio</p>
          <h1 className="truncate text-2xl font-bold">{restaurant.name}</h1>
        </div>
      </div>
    </header>
  );
}
