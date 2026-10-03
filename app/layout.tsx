import { PUBLIC_ASSETS } from "@/constants/assets";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ReactNode, Suspense } from "react";
import Script from "next/script";
import "./styles/globals.css";
import Providers from "./providers";
import { TopRouteProgress } from "@/components/molecules";

const pretendard = localFont({
  src: "../public/fonts/pretendard-variable.woff2",
  display: "swap",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: "Pillchat",
  description: "Pillchat",
  icons: {
    icon: PUBLIC_ASSETS.brand.pillchatLogo,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko" className={pretendard.variable} suppressHydrationWarning>
      <body className="font-sans">
        <Script
          src="https://developers.kakao.com/sdk/js/kakao.min.js"
          strategy="afterInteractive"
        />
        <Suspense fallback={null}>
          <TopRouteProgress />
        </Suspense>
        <div className="container mx-auto w-full max-w-screen-sm md:max-w-none">
          <Providers>
            <Suspense>{children}</Suspense>
          </Providers>
        </div>
      </body>
    </html>
  );
}
