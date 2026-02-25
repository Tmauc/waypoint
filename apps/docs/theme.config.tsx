import type { DocsThemeConfig } from "nextra-theme-docs";

const config: DocsThemeConfig = {
  logo: <strong>waypoint</strong>,
  project: {
    link: "https://github.com/your-org/waypoint",
  },
  docsRepositoryBase: "https://github.com/your-org/waypoint/tree/main/apps/docs",
  footer: {
    text: "waypoint — MIT License",
  },
  useNextSeoProps() {
    return {
      titleTemplate: "%s – waypoint",
    };
  },
};

export default config;
