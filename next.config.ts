import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // sharp (xử lý ảnh) nạp thư viện libvips bằng hệ điều hành nên Next không tự lần ra được –
  // khai báo để bản standalone luôn có đủ tệp.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/@img/**/*"],
  },
  // Video lời chúc nằm ngay trong thiệp (sector "video"); link /wedmemo cũ dẫn về đó. Máy ở sảnh dùng /wedmemo/kiosk.
  async redirects() {
    return [
      { source: "/wedmemo", destination: "/#video", permanent: false },
      { source: "/tro-choi/:path*", destination: "/#games", permanent: false }, // trò chơi giờ chơi ngay trong thiệp
    ];
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
