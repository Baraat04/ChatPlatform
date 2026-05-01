import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Be_Vietnam_Pro } from 'next/font/google';
import "./globals.css";
import LayoutWrapper from "./components/LayoutWrapper/LayoutWrapper";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin'],
  variable: '--font-be-vietnam',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: "BotFlow Dashboard",
  description: "Enterprise AI Bot Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${beVietnamPro.variable}`}>
      <body>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
