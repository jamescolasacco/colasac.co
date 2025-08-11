import type { Metadata } from "next";
import "./globals.css";

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
              <a href="/">home</a>
              <a href="/photo">photo</a>
              <a href="/audio">audio</a>
              <a href="/contact">contact</a>
            </nav>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}