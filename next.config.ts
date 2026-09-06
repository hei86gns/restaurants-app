import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発サーバーに同じWi-Fi内の端末からアクセスするための設定
  allowedDevOrigins: ["192.168.10.167"],
};

export default nextConfig;
