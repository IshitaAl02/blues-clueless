import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blue's Clueless",
  description: "We have no idea either. A tiny, ephemeral group chat.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
