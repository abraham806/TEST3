import type { Metadata, Viewport } from "next";
import { Exo_2, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Exo_2({
  variable: "--font-exo",
  subsets: ["latin"],
  weight: ["200", "300", "400"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["300", "400"],
});

export const metadata: Metadata = {
  title: "JARVIS",
  description: "Assistant vocal personnel",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#01040a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${display.variable} ${mono.variable} h-full antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
