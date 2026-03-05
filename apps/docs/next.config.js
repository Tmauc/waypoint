const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
});

module.exports = withNextra({
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  async redirects() {
    return [
      {
        source: "/api/url-template-engine",
        destination: "/api/use-waypoint",
        permanent: true,
      },
    ];
  },
});
