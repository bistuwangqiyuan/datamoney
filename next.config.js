/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 优化图片
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  
  // 环境变量
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'DataMoney',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  
  // 实验性功能
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Webpack 配置
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // 忽略 Supabase Edge Functions
    config.module.rules.push({
      test: /supabase\/functions\/.*/,
      use: 'ignore-loader',
    });
    
    return config;
  },
  
  // TypeScript 配置
  typescript: {
    // 忽略 Supabase Edge Functions 目录的类型检查
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;

