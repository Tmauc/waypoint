const PACKAGES = [
  {
    name: "@waypointjs/core",
    description:
      "Schema types, condition engine, tree resolver, Zustand runtime store and Zod schema generator. Zero React dependency.",
    install: "pnpm add @waypointjs/core",
    accent: "#8b5cf6",
  },
  {
    name: "@waypointjs/react",
    description:
      "Headless hooks for any React app. useWaypoint and useWaypointStep take a store instance and are router-agnostic.",
    install: "pnpm add @waypointjs/react",
    accent: "#00d4ff",
  },
  {
    name: "@waypointjs/next",
    description:
      "Next.js App Router integration. WaypointRunner provider, useWaypointStep with react-hook-form + Zod, auto-resume.",
    install: "pnpm add @waypointjs/next",
    accent: "#22c55e",
  },
  {
    name: "@waypointjs/builder",
    description:
      "Embeddable no-code UI for building WaypointSchemas. 3-column editor + live preview mode. Drop it anywhere in your app.",
    install: "pnpm add @waypointjs/builder",
    accent: "#f59e0b",
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
            Four packages, one system
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)" }}>
            Use only what you need. Each package is independently installable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <h3
                  className="text-xs font-mono font-semibold mb-3 px-2 py-1 rounded inline-block"
                  style={{
                    color: pkg.accent,
                    background: `${pkg.accent}18`,
                  }}
                >
                  {pkg.name}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.7)" }}
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
