export function CodeSection() {
  return (
    <section className="py-24 px-6" style={{ background: "#050510" }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: "#fff" }}
          >
            Schema → Runner → Done
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)" }}>
            Define your journey once. Waypoint handles the rest.
          </p>
        </div>

        {/* Editor window */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 0 60px rgba(0,212,255,0.06)",
          }}
        >
          {/* Tab bar */}
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ background: "#0d1117", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <span className="w-3 h-3 rounded-full" style={{ background: "#ff5f56" }} />
            <span className="w-3 h-3 rounded-full" style={{ background: "#ffbd2e" }} />
            <span className="w-3 h-3 rounded-full" style={{ background: "#27c93f" }} />
            <span
              className="ml-4 text-xs font-mono"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              onboarding/layout.tsx
            </span>
          </div>

          {/* Code */}
          <pre
            className="p-6 overflow-x-auto text-sm leading-7"
            style={{ background: "#0d1117", margin: 0 }}
          >
            <code>
              <Line>
                <Kw>import</Kw>
                {" { WaypointRunner } "}
                <Kw>from</Kw>
                {" "}
                <Str>&apos;@waypointjs/next&apos;</Str>
                {";"}
              </Line>
              <Line>
                <Kw>import</Kw>
                {" { schema } "}
                <Kw>from</Kw>
                {" "}
                <Str>&apos;./schema&apos;</Str>
                {";"}
              </Line>
              <br />
              <Line>
                <Cmt>{"// Wrap your steps — that's it"}</Cmt>
              </Line>
              <Line>
                <Kw>export default function</Kw>
                {" "}
                <Fn>Layout</Fn>
                {"({ children }) {"}
              </Line>
              <Line indent={1}>
                <Kw>return</Kw>
                {" ("}
              </Line>
              <Line indent={2}>
                {"<"}
                <Fn>WaypointRunner</Fn>
              </Line>
              <Line indent={3}>
                <Var>schema</Var>
                {"={schema}"}
              </Line>
              <Line indent={3}>
                <Var>onComplete</Var>
                {"={(data) => "}
                <Fn>save</Fn>
                {"(data)}"}
              </Line>
              <Line indent={2}>{">"}</Line>
              <Line indent={3}>{"{ children }"}</Line>
              <Line indent={2}>
                {"</"}
                <Fn>WaypointRunner</Fn>
                {">"}
              </Line>
              <Line indent={1}>{")"}</Line>
              <Line>{"}"}</Line>
              <br />
              <Line>
                <Cmt>{"// In each step page"}</Cmt>
              </Line>
              <Line>
                <Kw>export default function</Kw>
                {" "}
                <Fn>StepPage</Fn>
                {"() {"}
              </Line>
              <Line indent={1}>
                <Kw>const</Kw>
                {" { "}
                <Var>fields</Var>
                {", "}
                <Var>form</Var>
                {", "}
                <Var>handleSubmit</Var>
                {", "}
                <Var>progress</Var>
                {" } = "}
                <Fn>useWaypointStep</Fn>
                {"();"}
              </Line>
              <Line indent={1}>
                <Kw>return</Kw>
                {" <"}
                <Fn>StepRenderer</Fn>
                {" "}
                <Var>fields</Var>
                {"={fields}"}
                {" "}
                <Var>onNext</Var>
                {"={handleSubmit} />;"}
              </Line>
              <Line>{"}"}</Line>
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}

function Line({
  children,
  indent = 0,
}: {
  children: React.ReactNode;
  indent?: number;
}) {
  return (
    <div style={{ paddingLeft: `${indent * 1.5}rem`, color: "#e6edf3" }}>
      {children}
    </div>
  );
}

function Kw({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "#ff7b72" }}>{children}</span>;
}

function Str({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "#a5d6ff" }}>{children}</span>;
}

function Fn({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "#d2a8ff" }}>{children}</span>;
}

function Var({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "#ffa657" }}>{children}</span>;
}

function Cmt({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "#8b949e" }}>{children}</span>;
}
