import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blue's Clueless",
  description: "We have no idea either. A tiny, ephemeral group chat.",
};

// Apply saved theme before paint to avoid a flash.
const themeInitScript = `
try {
  var t = localStorage.getItem('bc:theme');
  if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  if (t === 'dark') document.documentElement.classList.add('dark');
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
