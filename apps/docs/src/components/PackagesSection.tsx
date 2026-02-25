const PACKAGES = [
  {
    name: "@waypoint/core",
    description:
      "Framework-agnostic engine. Journey tree builder, step resolution, history management, and progress calculation.",
    install: "pnpm add @waypoint/core",
    accent: "#8b5cf6",
  },
  {
    name: "@waypoint/react",
    description:
      "React hooks and context providers. useJourney, useStep, useProgress — all the primitives you need.",
    install: "pnpm add @waypoint/react",
    accent: "#00d4ff",
  },
  {
    name: "@waypoint/next",
    description:
      "Next.js integration with App Router support. URL syncing, middleware helpers, and server-side resume.",
    install: "pnpm add @waypoint/next",
    accent: "#22c55e",
  },
];

export function PackagesSection() {
  return (
    <section className="py-24 px-6" style={{ background: "#070714" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: "#fff" }}
          >
            Three packages, one system
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)" }}>
            Use only what you need. Each package is independently installable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.name}
              className="rounded-xl p-6 flex flex-col gap-4"
              style={{
                border: `1px solid ${pkg.accent}22`,
                background: `${pkg.accent}06`,
              }}
            >
              <div>
                <div
                  className="text-xs font-mono font-semibold mb-3 px-2 py-1 rounded inline-block"
                  style={{
                    color: pkg.accent,
                    background: `${pkg.accent}18`,
                  }}
                >
                  {pkg.name}
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  {pkg.description}
                </p>
              </div>

              <div
                className="mt-auto font-mono text-xs px-3 py-2 rounded"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  color: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {pkg.install}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
