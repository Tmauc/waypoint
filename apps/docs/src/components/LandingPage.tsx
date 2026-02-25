import dynamic from "next/dynamic";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { CodeSection } from "./CodeSection";
import { PackagesSection } from "./PackagesSection";
import { FooterSection } from "./FooterSection";

const WaypointScene = dynamic(
  () => import("./WaypointScene").then((m) => ({ default: m.WaypointScene })),
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
      {/* Hero with 3D canvas */}
      <div className="relative" style={{ height: "100vh" }}>
        <WaypointScene />
        <HeroSection />
      </div>

      <FeaturesSection />
      <CodeSection />
      <PackagesSection />
      <FooterSection />
    </div>
  );
}
