import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vinfurniture.vn";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/vi/admin/", "/zh-CN/admin/",
        "/vi/account/", "/zh-CN/account/",
        "/vi/cart", "/zh-CN/cart",
        "/vi/checkout/", "/zh-CN/checkout/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
