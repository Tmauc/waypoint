const FEATURES = [
  {
    icon: "📋",
    title: "Versioned Schema",
    description:
      "Define your entire journey in a portable JSON schema — steps, fields, validation rules and conditions. Export, version-control and share across projects.",
  },
  {
    icon: "⚡",
    title: "Conditional Logic",
    description:
      "Show or hide steps and fields based on data with a composable AND/OR condition engine. 13 operators, nested groups, external variables.",
  },
  {
    icon: "📊",
    title: "Progress Tracking",
    description:
      "Built-in progress calculation based on the resolved tree. Always reflects the real number of visible steps, not a static count.",
  },
  {
    icon: "🔒",
    title: "Zod Validation",
    description:
      "Automatic Zod schema generation from field definitions. Pair with react-hook-form for server-quality validation with zero boilerplate.",
  },
  {
    icon: "⏩",
    title: "Resume & Persistence",
    description:
      "Persist journey data to localStorage with Zustand middleware. Deep-link users back to their last valid step on return.",
  },
  {
    icon: "🏗️",
    title: "No-Code Builder",
    description:
      "Drop in <WaypointBuilder> to give your users a visual editor. Build schemas, configure conditions and test journeys without writing code.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 px-6" style={{ background: "rgba(7,7,20,0.88)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: "#fff" }}
          >
            Everything you need
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)" }}>
            Waypoint handles the hard parts so you can focus on your product.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-6 transition-all duration-200 cursor-default"
              style={{
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div aria-hidden="true" className="text-2xl mb-3">{f.icon}</div>
              <h3
                className="text-base font-semibold mb-2"
                style={{ color: "#fff" }}
              >
                {f.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
