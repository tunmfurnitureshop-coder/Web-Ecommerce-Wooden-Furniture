import { CollectionCard } from "./collection-card";

interface Collection {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string | null;
  coverImageUrl?: string | null;
  productCount?: number;
}

interface CollectionGridProps {
  collections: Collection[];
  locale: string;
}

export function CollectionGrid({ collections, locale }: CollectionGridProps) {
  if (!collections.length) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {collections.map((c) => (
        <CollectionCard key={c.id} {...c} locale={locale} />
      ))}
    </div>
  );
}
