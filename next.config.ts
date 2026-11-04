import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // sharp (xử lý ảnh) nạp thư viện libvips bằng hệ điều hành nên Next không tự lần ra được –
  // khai báo để bản standalone luôn có đủ tệp.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/@img/**/*"],
  },
  images: {
    // Ảnh tạm là SVG; ảnh thật (jpg/webp) vẫn được tối ưu như bình thường.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
