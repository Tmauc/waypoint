import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waypoint Demo",
  description:
    "Interactive examples for the waypoint journey navigation library",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <nav className="border-b bg-white px-6 py-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <span className="text-xl font-bold tracking-tight">waypoint</span>
            <div className="flex gap-6 text-sm text-gray-600">
              <a href="/" className="hover:text-gray-900">
                Home
              </a>
              <a href="/simple-journey" className="hover:text-gray-900">
                Simple Journey
              </a>
              <a href="/multi-journey" className="hover:text-gray-900">
                Multi Journey
              </a>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
