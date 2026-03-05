import Link from "next/link";

const FEATURES = [
  {
    label: "3-column editor",
    desc: "Steps · Fields · Config — everything visible at once.",
  },
  {
    label: "▶ Live preview",
    desc: "Test conditions and validation without leaving the editor.",
  },
  {
    label: "Condition builder",
    desc: "AND/OR rules, nested groups, external variables — all point-and-click.",
  },
  {
    label: "Exports clean JSON",
    desc: "Every schema is a plain WaypointSchema object ready to commit.",
  },
];

export function BuilderSection() {
  return (
    <section className="py-24 px-6" style={{ background: "#050510" }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
            style={{
              border: "1px solid rgba(245,158,11,0.3)",
              background: "rgba(245,158,11,0.06)",
              color: "#f59e0b",
            }}
          >
            @waypoint/builder
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: "#fff" }}
          >
            Build journeys visually
          </h2>
          <p
            className="max-w-xl mx-auto text-base leading-relaxed"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Drop{" "}
            <code
              className="text-sm px-1.5 py-0.5 rounded"
              style={{
                background: "rgba(245,158,11,0.12)",
                color: "#f59e0b",
                fontFamily: "monospace",
              }}
            >
              {"<WaypointBuilder />"}
            </code>{" "}
            into any admin page. Configure steps, fields, conditions and
            validation rules — no code required. Export a versioned JSON schema
            your team can commit and ship.
          </p>
        </div>

        {/* Builder mockup */}
        <div
          className="rounded-2xl overflow-hidden mb-12"
          style={{
            border: "1px solid rgba(245,158,11,0.15)",
            boxShadow:
              "0 0 80px rgba(245,158,11,0.06), 0 0 0 1px rgba(255,255,255,0.04) inset",
          }}
        >
          {/* Toolbar */}
          <div
            className="flex items-center justify-between px-4 py-3 gap-4"
            style={{
              background: "#111827",
              borderBottom: "1px solid #1f2937",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="font-bold text-sm tracking-tight"
                style={{ color: "#a78bfa" }}
              >
                ◈ waypoint
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  background: "rgba(245,158,11,0.15)",
                  color: "#f59e0b",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                User Onboarding
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MockBtn amber>▶ Tester</MockBtn>
              <MockBtn>Import</MockBtn>
              <MockBtn>Export</MockBtn>
              <MockBtn accent>Save</MockBtn>
            </div>
          </div>

          {/* 3-column layout */}
          <div className="flex" style={{ minHeight: 340, background: "#0f1117" }}>

            {/* Column 1 — Steps */}
            <div
              className="flex flex-col"
              style={{
                width: "22%",
                borderRight: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <ColHeader label="Steps" action="+ Add" />
              <div className="flex flex-col gap-1 p-2">
                <StepItem label="Personal info" active />
                <StepItem label="Company details" conditional />
                <StepItem label="Confirm" />
              </div>
            </div>

            {/* Column 2 — Fields */}
            <div
              className="flex flex-col"
              style={{
                width: "28%",
                borderRight: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <ColHeader label="Fields — Personal info" action="+ Field" />
              <div className="flex flex-col gap-1 p-2">
                <FieldItem type="text" label="Full name" required />
                <FieldItem type="email" label="Email address" required />
                <FieldItem type="select" label="Account type" required selected />
                <FieldItem type="tel" label="Phone" />
              </div>
            </div>

            {/* Column 3 — Editor */}
            <div className="flex flex-col flex-1">
              <ColHeader label="Field — Account type" />
              <div className="p-4 flex flex-col gap-4">
                {/* Field config rows */}
                <ConfigRow label="Type">
                  <span
                    className="text-xs px-2 py-1 rounded font-mono"
                    style={{
                      background: "rgba(139,92,246,0.15)",
                      color: "#a78bfa",
                      border: "1px solid rgba(139,92,246,0.2)",
                    }}
                  >
                    select
                  </span>
                </ConfigRow>
                <ConfigRow label="Label">
                  <MockInput value="Account type" />
                </ConfigRow>
                <ConfigRow label="Options">
                  <div className="flex flex-col gap-1 w-full">
                    <OptionRow label="Personal" value="personal" />
                    <OptionRow label="Business" value="business" />
                  </div>
                </ConfigRow>
                <ConfigRow label="Validation">
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      background: "rgba(239,68,68,0.12)",
                      color: "#f87171",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    required
                  </span>
                </ConfigRow>

                {/* Condition block */}
                <div
                  className="rounded-lg p-3 mt-1"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    className="text-xs font-semibold mb-3"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    VISIBLE WHEN
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <ConditionPill>personal.role</ConditionPill>
                    <ConditionPill muted>equals</ConditionPill>
                    <ConditionPill amber>&quot;business&quot;</ConditionPill>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="rounded-xl p-5"
              style={{
                border: "1px solid rgba(245,158,11,0.1)",
                background: "rgba(245,158,11,0.04)",
              }}
            >
              <div
                className="text-sm font-semibold mb-1.5"
                style={{ color: "#fbbf24" }}
              >
                {f.label}
              </div>
              <div
                className="text-sm leading-relaxed"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://waypoint-demo.vercel.app/builder"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #f59e0b, #f97316)",
              color: "#000",
              boxShadow: "0 0 24px rgba(245,158,11,0.25)",
            }}
          >
            Try the Builder →
          </a>
          <Link
            href="/guides/builder"
            className="px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200"
            style={{
              border: "1px solid rgba(245,158,11,0.2)",
              color: "#f59e0b",
              background: "rgba(245,158,11,0.06)",
            }}
          >
            Read the docs
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function MockBtn({
  children,
  accent,
  amber,
}: {
  children: React.ReactNode;
  accent?: boolean;
  amber?: boolean;
}) {
  return (
    <button
      className="text-xs px-3 py-1.5 rounded font-medium"
      style={
        accent
          ? {
              background: "rgba(139,92,246,0.2)",
              color: "#a78bfa",
              border: "1px solid rgba(139,92,246,0.25)",
            }
          : amber
          ? {
              background: "rgba(245,158,11,0.18)",
              color: "#f59e0b",
              border: "1px solid rgba(245,158,11,0.25)",
            }
          : {
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.08)",
            }
      }
    >
      {children}
    </button>
  );
}

function ColHeader({
  label,
  action,
}: {
  label: string;
  action?: string;
}) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2.5"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {label}
      </span>
      {action && (
        <span
          className="text-xs"
          style={{ color: "rgba(139,92,246,0.8)", cursor: "pointer" }}
        >
          {action}
        </span>
      )}
    </div>
  );
}

function StepItem({
  label,
  active,
  conditional,
}: {
  label: string;
  active?: boolean;
  conditional?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{
        background: active
          ? "rgba(139,92,246,0.12)"
          : "transparent",
        border: active
          ? "1px solid rgba(139,92,246,0.2)"
          : "1px solid transparent",
        cursor: "pointer",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: active ? "#a78bfa" : "rgba(255,255,255,0.2)" }}
      />
      <span
        className="text-xs flex-1 truncate"
        style={{ color: active ? "#fff" : "rgba(255,255,255,0.5)" }}
      >
        {label}
      </span>
      {conditional && (
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{
            background: "rgba(245,158,11,0.12)",
            color: "#f59e0b",
            fontSize: "9px",
          }}
        >
          IF
        </span>
      )}
    </div>
  );
}

function FieldItem({
  type,
  label,
  required,
  selected,
}: {
  type: string;
  label: string;
  required?: boolean;
  selected?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{
        background: selected ? "rgba(139,92,246,0.1)" : "transparent",
        border: selected
          ? "1px solid rgba(139,92,246,0.18)"
          : "1px solid transparent",
        cursor: "pointer",
      }}
    >
      <span
        className="text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0"
        style={{
          background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.35)",
          fontSize: "9px",
        }}
      >
        {type}
      </span>
      <span
        className="text-xs flex-1 truncate"
        style={{ color: selected ? "#fff" : "rgba(255,255,255,0.55)" }}
      >
        {label}
      </span>
      {required && (
        <span style={{ color: "#f87171", fontSize: "10px" }}>*</span>
      )}
    </div>
  );
}

function ConfigRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="text-xs w-20 flex-shrink-0 pt-1"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function MockInput({ value }: { value: string }) {
  return (
    <div
      className="text-xs px-2 py-1 rounded w-full"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.7)",
      }}
    >
      {value}
    </div>
  );
}

function OptionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="text-xs px-2 py-0.5 rounded flex-1"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.6)",
        }}
      >
        {label}
      </div>
      <div
        className="text-xs px-2 py-0.5 rounded flex-1"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.35)",
          fontFamily: "monospace",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ConditionPill({
  children,
  muted,
  amber,
}: {
  children: React.ReactNode;
  muted?: boolean;
  amber?: boolean;
}) {
  return (
    <span
      className="text-xs px-2 py-1 rounded font-mono"
      style={
        amber
          ? {
              background: "rgba(245,158,11,0.15)",
              color: "#fbbf24",
              border: "1px solid rgba(245,158,11,0.2)",
            }
          : muted
          ? {
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.35)",
              border: "1px solid rgba(255,255,255,0.08)",
            }
          : {
              background: "rgba(139,92,246,0.15)",
              color: "#a78bfa",
              border: "1px solid rgba(139,92,246,0.2)",
            }
      }
    >
      {children}
    </span>
  );
}
