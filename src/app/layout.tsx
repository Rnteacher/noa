import type { Metadata } from "next";
import { Geist_Mono, Heebo } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { t } from "@/lib/i18n";
import { DEFAULT_THEME, THEME_COOKIE, isThemeId } from "@/lib/theme";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: t("app.title"),
  description: "Chamama Staff Portal",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value;
  const theme = isThemeId(themeCookie) ? themeCookie : DEFAULT_THEME;

  return (
    <html
      lang="he"
      dir="rtl"
      data-theme={theme}
      className={`${heebo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-ink">
        {children}
      </body>
    </html>
  );
}
