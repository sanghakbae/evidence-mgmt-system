import { defineConfig } from "vite";

// GitHub Pages 배포 시 레포 경로(base)가 필요합니다.
// 로컬 개발은 기본 "/"를 사용합니다.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
});

