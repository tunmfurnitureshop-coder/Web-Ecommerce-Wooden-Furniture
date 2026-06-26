import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/lib/i18n";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ContactFab } from "@/components/contact/contact-fab";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CustomerAuthProvider } from "@/components/customer/CustomerAuthContext";
import { JsonLd } from "@/design-system/seo/json-ld";
import { BUSINESS_CONFIG, buildLocalBusinessSchema } from "@/lib/business-config";
import { Playfair_Display, Manrope } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";

// Playfair Display ships a proper `vietnamese` subset, so stacked diacritics
// (ỗ, ữ, ẵ…) render correctly — DM Serif Display fell back to a system serif.
const playfairDisplay = Playfair_Display({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nội Thất Gỗ Tự Nhiên",
  description: "Nội thất gỗ tự nhiên cao cấp",
};

// `viewportFit: "cover"` exposes env(safe-area-inset-*) for the mobile bottom nav
// and sticky CTAs; themeColor matches the page background. Next already auto-injects
// the width=device-width meta — this only adds theme color + safe-area handling.
export const viewport: Viewport = {
  themeColor: "#FAF8F5",
  viewportFit: "cover",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "vi" | "zh-CN")) {
    notFound();
  }
  const messages = await getMessages();
  return (
    <html lang={locale} className={`${playfairDisplay.variable} ${manrope.variable}`}>
      <body>
        <JsonLd data={buildLocalBusinessSchema(BUSINESS_CONFIG)} />
        <NextIntlClientProvider messages={messages}>
          <CustomerAuthProvider>
            <Header />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <BottomNav />
            <ContactFab />
          </CustomerAuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
