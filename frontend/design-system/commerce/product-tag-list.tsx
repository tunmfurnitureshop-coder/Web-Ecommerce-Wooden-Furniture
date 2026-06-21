import { Link } from "@/i18n/navigation";

interface Tag {
  code: string;
  type: string;
  name: string;
  slug: string;
}

interface ProductTagListProps {
  tags: Tag[];
  locale: string;
  linkType?: "material" | "catalog";
}

export function ProductTagList({ tags, locale, linkType = "catalog" }: ProductTagListProps) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const href =
          linkType === "material" && tag.type === "MATERIAL"
            ? `/materials/${tag.slug}`
            : `/products?tags=${tag.code}`;
        return (
          <Link
            key={tag.code}
            href={href}
            locale={locale}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-surface-muted text-text-secondary hover:bg-brand hover:text-text-inverse border border-border-default hover:border-brand transition-colors"
          >
            {tag.name}
          </Link>
        );
      })}
    </div>
  );
}
