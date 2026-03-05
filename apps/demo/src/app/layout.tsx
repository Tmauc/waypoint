import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waypoint Demo",
  description: "Visual builder for multi-step journey schemas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <nav className="border-b bg-white px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold tracking-tight text-indigo-600">◈ waypoint</span>
            <span className="text-gray-300">/</span>
            <a href="/builder" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Builder
            </a>
          </div>
        </nav>
        <main className="h-[calc(100vh-49px)]">{children}</main>
      </body>
    </html>
  );
}
