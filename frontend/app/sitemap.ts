import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vinfurniture.vn";
const LOCALES = ["vi", "zh-CN"];

function localizedUrls(path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) {
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    priority,
    changeFrequency,
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`])),
    },
  }));
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const base = process.env.BACKEND_URL ?? "http://localhost:8000";
    const res = await fetch(`${base}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections, categories, guides] = await Promise.all([
    fetchJson<{ items: Array<{ slug: string; updated_at?: string }> }>("/api/v1/products?pageSize=200&locale=vi"),
    fetchJson<{ items: Array<{ slug: string; published_at?: string }> }>("/api/v1/collections?locale=vi"),
    fetchJson<{ items: Array<{ slug: string }> }>("/api/v1/taxonomy/categories?locale=vi"),
    fetchJson<{ items: Array<{ slug: string; published_at?: string }> }>("/api/v1/guides?pageSize=100&locale=vi"),
  ]);

  const entries: MetadataRoute.Sitemap = [
    ...localizedUrls("/", 1.0, "daily"),
    ...localizedUrls("/collections", 0.8, "weekly"),
    ...localizedUrls("/guides", 0.8, "weekly"),
  ];

  for (const p of products?.items ?? []) {
    entries.push(...localizedUrls(`/products/${p.slug}`, 0.9, "weekly"));
  }
  for (const c of collections?.items ?? []) {
    entries.push(...localizedUrls(`/collections/${c.slug}`, 0.8, "weekly"));
  }
  for (const cat of categories?.items ?? []) {
    entries.push(...localizedUrls(`/categories/${cat.slug}`, 0.7, "weekly"));
  }
  for (const g of guides?.items ?? []) {
    entries.push(...localizedUrls(`/guides/${g.slug}`, 0.7, "monthly"));
  }

  return entries;
}
