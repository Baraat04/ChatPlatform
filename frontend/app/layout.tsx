import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from 'next/font/google';
import "./globals.css";
import LayoutWrapper from "./components/LayoutWrapper/LayoutWrapper";
import { AuthProvider } from "./contexts/AuthContext";

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "UP-CHAT — AI Bot Platform",
  description: "Платформа для создания и управления AI-ботами для Telegram и WhatsApp",
  icons: {
    icon: [
      { url: '/logo.jpg', type: 'image/jpeg' },
    ],
    apple: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <script async defer crossOrigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.fbAsyncInit = function() {
                FB.init({
                  appId      : '${process.env.NEXT_PUBLIC_WA_APP_ID}',
                  cookie     : true,
                  xfbml      : true,
                  version    : 'v21.0'
                });
              };
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
