const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
});

module.exports = withNextra({
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
});
