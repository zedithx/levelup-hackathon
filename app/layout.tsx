import type { Metadata } from "next";
import { Bebas_Neue, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap"
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas-neue",
  display: "swap"
});

export const metadata: Metadata = {
  title: "SCAPE Pulse",
  description: "AR gamified squad onboarding experience"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${bebasNeue.variable}`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
