const FEATURES = [
  {
    icon: "🌿",
    title: "Journey Trees",
    description:
      "Define your navigation structure as a declarative tree. Branches, conditions, and sub-journeys all compose naturally.",
  },
  {
    icon: "🧭",
    title: "Smart Navigation",
    description:
      "Go to next, previous, or jump directly to any step. The router handles URL updates and history automatically.",
  },
  {
    icon: "📊",
    title: "Progress Tracking",
    description:
      "Built-in progress calculation per journey. Always know where the user is and how far they've come.",
  },
  {
    icon: "🔀",
    title: "Multi-Journey",
    description:
      "Run multiple concurrent journeys with fully isolated state. Perfect for wizard-within-wizard patterns.",
  },
  {
    icon: "🔗",
    title: "URL Templates",
    description:
      "Steps are backed by URL templates with typed parameters. Deep-linking and sharing work out of the box.",
  },
  {
    icon: "⏩",
    title: "Resume Support",
    description:
      "Persist journey state and resume exactly where the user left off, even after a page refresh or navigation away.",
  },
];

export function FeaturesSection() {
  return (
    <section
      className="py-24 px-6"
      style={{ background: "#070714" }}
    >
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
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3
                className="text-base font-semibold mb-2"
                style={{ color: "#fff" }}
              >
                {f.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "rgba(255,255,255,0.45)" }}
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
