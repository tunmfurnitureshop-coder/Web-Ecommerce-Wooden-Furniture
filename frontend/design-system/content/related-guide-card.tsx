import { Link } from "@/i18n/navigation";
import Image from "next/image";

interface RelatedGuideCardProps {
  id: string;
  type: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  readLabel: string;
  locale: string;
}

export function RelatedGuideCard({
  type, title, slug, excerpt, coverImageUrl, readLabel, locale,
}: RelatedGuideCardProps) {
  return (
    <Link
      href={`/guides/${slug}`}
      locale={locale}
      className="group flex gap-3 items-start p-3 rounded-xl border border-border-default hover:border-border-strong bg-surface transition-colors"
    >
      <div className="relative w-20 h-16 shrink-0 rounded-lg overflow-hidden bg-surface-muted">
        {coverImageUrl ? (
          <Image src={coverImageUrl} alt={title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-surface-subtle" />
        )}
      </div>
      <div className="min-w-0">
        <span className="text-xs text-brand font-medium">{type.replace("_", " ")}</span>
        <p className="mt-0.5 text-sm font-semibold text-text-primary group-hover:text-brand transition-colors line-clamp-2">
          {title}
        </p>
        {excerpt && (
          <p className="mt-0.5 text-xs text-text-muted line-clamp-1">{excerpt}</p>
        )}
      </div>
    </Link>
  );
}
