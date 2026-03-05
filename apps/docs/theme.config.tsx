import type { DocsThemeConfig } from "nextra-theme-docs";

const config: DocsThemeConfig = {
  head: (
    <>
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <meta name="theme-color" content="#070714" />
    </>
  ),
  logo: <strong>◈ waypoint</strong>,
  project: {
    link: "https://github.com/tmauc/waypoint",
  },
  docsRepositoryBase: "https://github.com/tmauc/waypoint/tree/main/apps/docs",
  footer: {
    text: "waypoint — Schema-driven multi-step journeys — MIT License",
  },
  useNextSeoProps() {
    return {
      titleTemplate: "%s – waypoint",
    };
  },
};

export default config;
