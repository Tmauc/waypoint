import Head from "next/head";
import { LandingPage } from "../src/components/LandingPage";

export default function Home() {
  return (
    <>
      <Head>
        <title>Waypoint — Multi-step journey navigation</title>
        <meta
          name="description"
          content="Declarative journey trees, smart history management, and progress tracking for React & Next.js."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <LandingPage />
    </>
  );
}
