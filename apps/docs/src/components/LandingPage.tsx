import dynamic from "next/dynamic";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { CodeSection } from "./CodeSection";
import { BuilderSection } from "./BuilderSection";
import { PackagesSection } from "./PackagesSection";
import { FooterSection } from "./FooterSection";

const BranchCanvas = dynamic(
  () => import("./BranchCanvas").then((m) => ({ default: m.BranchCanvas })),
  { ssr: false }
);

const ScrollPathCanvas = dynamic(
  () => import("./ScrollPathCanvas").then((m) => ({ default: m.ScrollPathCanvas })),
  { ssr: false }
);

export function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050510",
        color: "#fff",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Fixed 3D canvas — fractal tree, behind everything */}
      <BranchCanvas />
      {/* Scroll-driven vine — screen blend, grows as user scrolls */}
      <ScrollPathCanvas />

      {/* Skip to main content — keyboard navigation */}
      <a
        href="#main-content"
        style={{
          position: "absolute",
          top: -999,
          left: -999,
          zIndex: 9999,
          padding: "8px 16px",
          background: "#8b5cf6",
          color: "#fff",
          fontWeight: 600,
          fontSize: 14,
          borderRadius: 6,
          textDecoration: "none",
        }}
        onFocus={(e) => {
          e.currentTarget.style.top = "16px";
          e.currentTarget.style.left = "16px";
        }}
        onBlur={(e) => {
          e.currentTarget.style.top = "-999px";
          e.currentTarget.style.left = "-999px";
        }}
      >
        Skip to main content
      </a>

      {/* Page content — no stacking context, lets children z-index into root */}
      <div style={{ position: "relative" }}>
        <HeroSection />
        <main id="main-content">
          <FeaturesSection />
          <CodeSection />
          <BuilderSection />
          <PackagesSection />
        </main>
        <FooterSection />
      </div>
    </div>
  );
}
