import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
    title: { default: "Chess Arena", template: "%s | Chess Arena" },
    description: "Rated chess against real opponents, or practise against the computer.",
    icons: "/favicon.ico",
};

export const viewport: Viewport = {
    colorScheme: "light dark",
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "white" },
        { media: "(prefers-color-scheme: dark)", color: "black" },
    ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-screen antialiased">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
