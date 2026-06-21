import { Link } from "@/i18n/navigation";
import Image from "next/image";

interface ArticleCardProps {
  id: string;
  type: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  authorName?: string | null;
  publishedAt?: string | null;
  locale: string;
}

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : "vi-VN", {
      year: "numeric", month: "long", day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function ArticleCard({
  type, title, slug, excerpt, coverImageUrl, authorName, publishedAt, locale,
}: ArticleCardProps) {
  return (
    <Link href={`/guides/${slug}`} locale={locale} className="group block">
      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-surface-muted">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-surface-subtle" />
        )}
      </div>
      <div className="mt-3">
        <span className="text-xs text-brand font-medium uppercase tracking-wide">{type.replace("_", " ")}</span>
        <h3 className="mt-1 font-semibold text-text-primary group-hover:text-brand transition-colors line-clamp-2">
          {title}
        </h3>
        {excerpt && (
          <p className="mt-1 text-sm text-text-secondary line-clamp-2">{excerpt}</p>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
          {authorName && <span>{authorName}</span>}
          {authorName && publishedAt && <span>·</span>}
          {publishedAt && <span>{formatDate(publishedAt, locale)}</span>}
        </div>
      </div>
    </Link>
  );
}
