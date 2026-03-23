import coreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...coreWebVitals,
  {
    ignores: [".next/**", "dist/**", "build/**", "next-env.d.ts"]
  }
];

export default config;

