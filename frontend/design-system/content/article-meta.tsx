interface ArticleMetaProps {
  authorName?: string | null;
  publishedAt?: string | null;
  publishedLabel: string;
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

export function ArticleMeta({ authorName, publishedAt, publishedLabel, locale }: ArticleMetaProps) {
  if (!authorName && !publishedAt) return null;
  return (
    <div className="flex items-center gap-3 text-sm text-text-muted">
      {authorName && (
        <span className="font-medium text-text-secondary">{authorName}</span>
      )}
      {authorName && publishedAt && <span>·</span>}
      {publishedAt && (
        <span>{publishedLabel} {formatDate(publishedAt, locale)}</span>
      )}
    </div>
  );
}
