import Head from "next/head";
import { LandingPage } from "../src/components/LandingPage";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://waypointjs.dev";
const OG_TITLE = "Waypoint — Multi-step journey navigation for React & Next.js";
const OG_DESCRIPTION =
  "Declarative journey trees, smart history management, and progress tracking for React & Next.js. Schema-driven, type-safe, zero boilerplate.";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Waypoint",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  description: OG_DESCRIPTION,
  url: SITE_URL,
  license: "https://opensource.org/licenses/MIT",
  author: {
    "@type": "Person",
    name: "tmauc",
    url: "https://github.com/tmauc",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function Home() {
  return (
    <>
      <Head>
        <title>{OG_TITLE}</title>
        <meta name="description" content={OG_DESCRIPTION} />
        <meta
          name="keywords"
          content="waypoint, react, nextjs, multi-step, journey, wizard, form, navigation, schema, typescript"
        />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={SITE_URL} />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content={OG_TITLE} />
        <meta property="og:description" content={OG_DESCRIPTION} />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Waypoint" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={OG_TITLE} />
        <meta name="twitter:description" content={OG_DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <LandingPage />
    </>
  );
}
