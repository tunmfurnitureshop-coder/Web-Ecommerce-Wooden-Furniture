import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/lib/i18n";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CustomerAuthProvider } from "@/components/customer/CustomerAuthContext";
import { DM_Serif_Display, Manrope } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nội Thất Gỗ Tự Nhiên",
  description: "Nội thất gỗ tự nhiên cao cấp",
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
    <html lang={locale} className={`${dmSerifDisplay.variable} ${manrope.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <CustomerAuthProvider>
            <Header />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </CustomerAuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
