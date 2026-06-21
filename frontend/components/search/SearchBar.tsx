"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Search, X } from "lucide-react";
import { Link, useRouter } from "@/lib/i18n";
import { api } from "@/lib/api";
import type { SuggestionsResponse } from "@/features/product/product.types";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  const t = useTranslations("search");
  const router = useRouter();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setSuggestions(null); return; }
    const timer = setTimeout(() => {
      api
        .get<SuggestionsResponse>(`/api/v1/products/suggestions?q=${encodeURIComponent(query)}&locale=${locale}`)
        .then(setSuggestions)
        .catch(() => setSuggestions(null));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, locale]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/products?q=${encodeURIComponent(q)}&sort=relevance`);
  }

  const hasSuggestions = suggestions && (
    suggestions.products.length > 0 || suggestions.categories.length > 0 || suggestions.woodTypes.length > 0
  );

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={t("placeholder")}
          className="pl-8 pr-7 h-9 w-56 text-sm"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); setSuggestions(null); }}
            className="absolute right-2 top-1/2 -translate-y-1/2">
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </form>

      {open && hasSuggestions && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-popover border rounded-lg shadow-md z-50 p-2 space-y-1 max-h-80 overflow-y-auto">
          {suggestions!.products.length > 0 && (
            <section>
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">{t("suggestions.products")}</p>
              {suggestions!.products.slice(0, 4).map((p) => (
                <Link key={p.slug} href={`/products/${p.slug}`} onClick={() => setOpen(false)}>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-sm cursor-pointer">
                    {p.primaryImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.primaryImageUrl} alt={p.name} className="w-8 h-8 object-cover rounded shrink-0" />
                    )}
                    <span className="line-clamp-1">{p.name}</span>
                  </div>
                </Link>
              ))}
            </section>
          )}
          {suggestions!.categories.length > 0 && (
            <section>
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">{t("suggestions.categories")}</p>
              {suggestions!.categories.slice(0, 3).map((c) => (
                <Link key={c.code} href={`/products?room=${c.code}`} onClick={() => setOpen(false)}>
                  <div className="px-2 py-1.5 rounded hover:bg-muted text-sm cursor-pointer">{c.name}</div>
                </Link>
              ))}
            </section>
          )}
          {suggestions!.woodTypes.length > 0 && (
            <section>
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">{t("suggestions.woodTypes")}</p>
              {suggestions!.woodTypes.slice(0, 3).map((w) => (
                <Link key={w.code} href={`/products?woodType=${w.code}`} onClick={() => setOpen(false)}>
                  <div className="px-2 py-1.5 rounded hover:bg-muted text-sm cursor-pointer">{w.name}</div>
                </Link>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
