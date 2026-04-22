import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 生产环境也显示详细错误（用于调试 admin 页面问题）
  productionBrowserSourceMaps: true,

  // 图片优化配置
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },

  // 压缩配置
  compress: true,

  // 实验性功能
  experimental: {
    // 优化包体积（注意：@prisma/client 需要完整引擎文件，不能加入 optimizePackageImports）
    optimizePackageImports: ["bcryptjs"],
    // 确保 Prisma engine 二进制文件被复制进 serverless bundle (Vercel)
    outputFileTracingIncludes: {
      "/**/*": ["./node_modules/.prisma/client/**/*"],
    },
  },

  // HTTP 响应头优化
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // 静态资源缓存
        source: "/:all*(svg|jpg|png|webp|avif|gif|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // JS/CSS 缓存
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // 重定向配置
  async redirects() {
    return [
      {
        source: "/",
        destination: "/zh",
        permanent: false,
      },
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },

  // webpack 配置
  webpack: (config, { dev, isServer }) => {
    // 生产环境优化
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
            },
            common: {
              minChunks: 2,
              chunks: "all",
              enforce: true,
            },
          },
        },
      };
    }
    return config;
  },

  // 类型检查
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },

  // 输出配置
  poweredByHeader: false,
  generateEtags: true,
};

export default withNextIntl(nextConfig);
