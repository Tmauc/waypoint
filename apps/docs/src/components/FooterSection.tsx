import Link from "next/link";

export function FooterSection() {
  return (
    <footer
      className="py-16 px-6"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(5,5,16,0.94)",
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-8">
        <div className="flex flex-col items-center sm:items-start gap-2">
          <span
            className="font-black text-xl tracking-tight"
            style={{ color: "#fff" }}
          >
            waypoint
          </span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            MIT License
          </span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-6">
          {[
            { label: "Documentation", href: "/introduction" },
            { label: "Getting Started", href: "/getting-started" },
            { label: "API Reference", href: "/api" },
            {
              label: "GitHub",
              href: "https://github.com/tmauc/waypoint",
              external: true,
            },
          ].map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm transition-colors duration-150"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm transition-colors duration-150"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </footer>
  );
}
