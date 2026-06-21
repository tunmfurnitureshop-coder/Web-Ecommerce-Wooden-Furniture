"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { X, Clock, TrendingUp } from "lucide-react";
import { SearchInput } from "@/design-system/components/search-input";
import { cn } from "@/lib/utils";

const RECENT_SEARCHES_KEY = "vin_recent_searches";
const MAX_RECENT = 5;
const DEBOUNCE_MS = 300;

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const prev = getRecentSearches().filter((q) => q !== query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([query, ...prev].slice(0, MAX_RECENT)));
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setRecent(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setSuggestions([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/products/search/suggestions?q=${encodeURIComponent(query)}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    onClose();
    router.push(`/products?q=${encodeURIComponent(trimmed)}`);
  }, [onClose, router]);

  if (!open) return null;

  const showRecent = !query && recent.length > 0;
  const showSuggestions = query.length >= 2 && (suggestions.length > 0 || isLoading);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />

      {/* Panel */}
      <div className="relative z-10 w-full bg-surface border-b border-border-default shadow-md">
        <div className="mx-auto max-w-container px-4 md:px-8 xl:px-12 py-4">
          <div className="flex items-center gap-3">
            <SearchInput
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery("")}
              placeholder={t("placeholder")}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit(query)}
              aria-label={t("inputLabel")}
              role="combobox"
              aria-expanded={showSuggestions}
              aria-controls="search-suggestions"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              className="shrink-0 text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          {/* Suggestions */}
          {(showRecent || showSuggestions) && (
            <div id="search-suggestions" role="listbox" className="mt-3 pb-2">
              {isLoading && (
                <div className="flex items-center gap-2 px-1 py-2 text-sm text-text-muted">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-border-default border-t-brand" aria-hidden />
                  {t("loading")}
                </div>
              )}

              {showRecent && !isLoading && (
                <>
                  <p className="mb-1 flex items-center gap-1.5 px-1 text-xs font-medium text-text-muted">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {t("recentSearches")}
                  </p>
                  {recent.map((q) => (
                    <button
                      key={q}
                      role="option"
                      aria-selected={false}
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus"
                      onClick={() => handleSubmit(q)}
                    >
                      {q}
                    </button>
                  ))}
                </>
              )}

              {showSuggestions && !isLoading && suggestions.length > 0 && (
                <>
                  <p className="mb-1 flex items-center gap-1.5 px-1 text-xs font-medium text-text-muted">
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                    {t("suggestions")}
                  </p>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      role="option"
                      aria-selected={false}
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus"
                      onClick={() => handleSubmit(s)}
                    >
                      {s}
                    </button>
                  ))}
                </>
              )}

              {showSuggestions && !isLoading && suggestions.length === 0 && (
                <p className="px-3 py-2 text-sm text-text-muted">{t("noSuggestions")}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
