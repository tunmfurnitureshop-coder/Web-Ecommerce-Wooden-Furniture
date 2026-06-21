import { ArticleCard } from "./article-card";

interface Article {
  id: string;
  type: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  author_name?: string | null;
  published_at?: string | null;
}

interface ArticleGridProps {
  articles: Article[];
  locale: string;
}

export function ArticleGrid({ articles, locale }: ArticleGridProps) {
  if (!articles.length) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((a) => (
        <ArticleCard
          key={a.id}
          id={a.id}
          type={a.type}
          title={a.title}
          slug={a.slug}
          excerpt={a.excerpt}
          coverImageUrl={a.cover_image_url}
          authorName={a.author_name}
          publishedAt={a.published_at}
          locale={locale}
        />
      ))}
    </div>
  );
}
