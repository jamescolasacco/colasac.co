import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "james colasacco",
  description: "photo & audio",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="site-wrap">
          {/* stacked logo */}
          <div className="logo" aria-label="logo">
            <div className="logo-mark" />
          </div>

          {/* top-right nav */}
          <header className="header">
            <nav className="nav">
              <Link href="/">home</Link>
              <Link href="/photo">photo</Link>
              <Link href="/audio">audio</Link>
              <Link href="/contact">contact</Link>
            </nav>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}