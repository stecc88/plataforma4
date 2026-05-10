import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ScribIA — Assistente di Scrittura AI in Italiano",
  description:
    "ScribIA è il tuo assistente di scrittura AI che ti aiuta a creare, correggere e migliorare testi in italiano con precisione e creatività.",
  keywords: [
    "ScribIA",
    "scrittura AI",
    "italiano",
    "correzione grammaticale",
    "generazione testi",
    "assistente di scrittura",
    "intelligenza artificiale",
  ],
  authors: [{ name: "ScribIA Team" }],
  openGraph: {
    title: "ScribIA — Assistente di Scrittura AI in Italiano",
    description:
      "Crea, correggi e migliora testi in italiano con l'intelligenza artificiale.",
    type: "website",
    siteName: "ScribIA",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScribIA — Assistente di Scrittura AI in Italiano",
    description:
      "Crea, correggi e migliora testi in italiano con l'intelligenza artificiale.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
