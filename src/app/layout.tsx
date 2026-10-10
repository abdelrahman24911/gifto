import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { BRAND } from "@/lib/constants";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BRAND.name} — Gifts in Egypt, wrapped properly`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "FL Tase3 is an Egyptian gift studio: curated gift boxes, personalized keepsakes and same-week delivery across Egypt.",
  applicationName: BRAND.name,
  keywords: ["gifts Egypt", "gift boxes Cairo", "personalized gifts", "FL Tase3"],
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: `${BRAND.name} — Gifts in Egypt, wrapped properly`,
    description: BRAND.tagline,
    url: siteUrl,
    locale: "en_EG",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.name,
    description: BRAND.tagline,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fbf7f4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
