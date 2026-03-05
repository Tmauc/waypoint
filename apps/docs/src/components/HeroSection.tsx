import Link from "next/link";

export function HeroSection() {
  return (
    <section
      className="relative flex flex-col items-center justify-center text-center px-6"
      style={{ minHeight: "100vh" }}
    >
      {/* Gradient fade at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, #050510)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-4xl mx-auto">
        {/* Badge */}
        <span
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{
            border: "1px solid rgba(0, 212, 255, 0.3)",
            background: "rgba(0, 212, 255, 0.06)",
            color: "#00d4ff",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#00d4ff", boxShadow: "0 0 6px #00d4ff" }}
          />
          v0.1.0 — Beta
        </span>

        {/* Title */}
        <h1
          className="font-black tracking-tighter leading-none"
          style={{
            fontSize: "clamp(4rem, 14vw, 10rem)",
            color: "#fff",
            textShadow:
              "0 0 40px rgba(0,212,255,0.35), 0 0 80px rgba(139,92,246,0.2)",
            letterSpacing: "-0.04em",
          }}
        >
          waypoint
        </h1>

        {/* Tagline */}
        <p
          className="text-lg sm:text-xl max-w-xl leading-relaxed"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          Multi-step journey navigation for React & Next.js.
          <br />
          Declarative trees. Smart history. Zero boilerplate.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
          <Link
            href="/getting-started"
            className="px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #00d4ff, #8b5cf6)",
              color: "#fff",
              boxShadow: "0 0 20px rgba(0,212,255,0.3)",
            }}
          >
            Get Started →
          </Link>
          <a
            href="https://github.com/mauc/waypoint"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200"
            style={{
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.8)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            GitHub
          </a>
        </div>

        {/* Install command */}
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-lg font-mono text-sm"
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#00d4ff",
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.3)" }}>$</span>
          pnpm add @waypoint/core @waypoint/react
        </div>
      </div>

      {/* Scroll hint — fixed at bottom of section */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        style={{ color: "rgba(255,255,255,0.25)" }}
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            animation: "bounce 2s infinite",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(6px);
          }
        }
      `}</style>
    </section>
  );
}
