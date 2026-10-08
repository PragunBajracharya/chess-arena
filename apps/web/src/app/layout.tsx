import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chess Arena",
  description: "Play chess online, against friends or bots",
  icons: "/favicon.ico",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
