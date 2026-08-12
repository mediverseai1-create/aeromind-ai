import type { Metadata } from "next";
import { Onest, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const onest = Onest({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-onest",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AeroMind AI — the AI sales analyst for teams with more data than time",
  description:
    "AeroMind reads your sales file, shows you what's working and what's slipping, and gives you a plan to scale what already works.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${onest.variable} ${instrumentSans.variable} ${ibmPlexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
