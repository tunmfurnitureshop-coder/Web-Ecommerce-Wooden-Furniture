"use client";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={[
        "prose prose-stone max-w-none",
        "prose-headings:text-text-primary prose-p:text-text-secondary",
        "prose-a:text-brand prose-a:no-underline hover:prose-a:underline",
        "prose-strong:text-text-primary prose-img:rounded-xl",
        "prose-blockquote:border-l-brand prose-blockquote:text-text-secondary",
        "prose-code:text-text-primary prose-code:bg-surface-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
        className ?? "",
      ].join(" ")}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
