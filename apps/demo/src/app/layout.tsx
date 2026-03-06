import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waypoint Demo",
  description: "Visual builder for multi-step journey schemas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className="min-h-screen antialiased"
        style={{
          background: "#050510",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <nav
          style={{
            background: "#070714",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            padding: "0 20px",
            height: 48,
            display: "flex",
            alignItems: "center",
            gap: 0,
          }}
        >
          {/* Logo */}
          <a
            href={process.env.NEXT_PUBLIC_DOCS_URL ?? "http://localhost:3002"}
            style={{
              fontWeight: 900,
              fontSize: 15,
              letterSpacing: "-0.03em",
              color: "#fff",
              marginRight: 24,
              textDecoration: "none",
            }}
          >
            <span style={{ color: "#a78bfa" }}>◈</span>{" "}waypoint
          </a>

          {/* Separator */}
          <span style={{ color: "rgba(255,255,255,0.12)", marginRight: 20, fontSize: 18 }}>|</span>

          {/* Nav links */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <NavLink href="/builder" label="Builder" />
            <NavLink href="/journeys" label="Journeys" />
          </div>

          {/* Right side */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              Demo
            </span>
            <a
              href="https://github.com/tmauc/waypoint"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 500,
                color: "rgba(255,255,255,0.4)",
                textDecoration: "none",
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              GitHub
            </a>
          </div>
        </nav>

        <main style={{ height: "calc(100vh - 48px)" }}>{children}</main>
      </body>
    </html>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="nav-link">
      {label}
    </a>
  );
}
