// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  devIndicators: {
    buildActivity: true, 
    autoPrerender: false,
  },
};

export default nextConfig;