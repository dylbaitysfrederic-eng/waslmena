const DEFAULT_RESTAURANT_DATA = {};
const DEFAULT_MENU_ITEMS: any[] = [];

// Hypothetical implementation for the Public Menu
export default function PublicMenu({ restaurantData = DEFAULT_RESTAURANT_DATA, menuItems = DEFAULT_MENU_ITEMS }: any) {
  const { showMenuItemImages = true } = restaurantData || {};

  return (
    <main className="p-4">
      <h1 className="mb-6 text-xl font-bold">{restaurantData?.name}</h1>

      <div className="space-y-4">
        {menuItems.map((item: any) => (
          <div key={item.id} className="flex gap-4 border-b pb-4">
            {/* Conditionally hide images based on organization preference */}
            {showMenuItemImages && item.imageUrl && (
              <div className="size-24 shrink-0">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="size-full rounded-md object-cover"
                />
              </div>
            )}
            <div className="flex flex-col justify-center">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="line-clamp-2 text-sm text-gray-600">{item.description}</p>
              <p className="mt-1 font-bold">{item.price}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
