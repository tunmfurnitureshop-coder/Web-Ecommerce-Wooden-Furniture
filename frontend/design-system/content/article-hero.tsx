import { Link } from "@/i18n/navigation";
import Image from "next/image";

interface ArticleHeroProps {
  type: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  authorName?: string | null;
  publishedAt?: string | null;
  readLabel: string;
  locale: string;
}

export function ArticleHero({
  type, title, slug, excerpt, coverImageUrl, authorName, publishedAt, readLabel, locale,
}: ArticleHeroProps) {
  return (
    <Link href={`/guides/${slug}`} locale={locale} className="group block">
      <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-surface-muted">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            priority
          />
        ) : (
          <div className="w-full h-full bg-surface-subtle" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 text-white max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
            {type.replace("_", " ")}
          </span>
          <h2 className="mt-2 text-2xl font-bold line-clamp-2">{title}</h2>
          {excerpt && <p className="mt-2 text-sm opacity-80 line-clamp-2">{excerpt}</p>}
          <div className="mt-3 flex items-center gap-2 text-xs opacity-70">
            {authorName && <span>{authorName}</span>}
            {authorName && publishedAt && <span>·</span>}
            {publishedAt && <span>{publishedAt.slice(0, 10)}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
