import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

// CLI에서 설정을 읽을 때는 인수, 서버 워커에서는 실제 바인딩된 PORT를 사용합니다.
function developmentPort() {
  const args = process.argv.slice(2);
  const index = args.findIndex((arg) => arg === "--port" || arg === "-p");
  const argument =
    index >= 0
      ? args[index + 1]
      : args.find((arg) => arg.startsWith("--port="))?.split("=")[1];
  const port = process.env.NEXT_PRIVATE_WORKER
    ? (process.env.PORT ?? argument)
    : (argument ?? process.env.PORT);
  return port && /^\d+$/.test(port) ? String(Number(port)) : "3000";
}

// 개발/프로덕션뿐 아니라 동시에 실행하는 개발 서버끼리도 청크를 공유하지 않습니다.
export default (phase: string): NextConfig => ({
  ...nextConfig,
  distDir:
    phase === PHASE_DEVELOPMENT_SERVER
      ? developmentPort() === "3000"
        ? ".next-dev"
        : `.next-dev-${developmentPort()}`
      : ".next",
});
