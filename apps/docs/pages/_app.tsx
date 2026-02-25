import type { AppProps } from "next/app";
import "../src/styles/landing.css";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
