import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', 'maath'],
  webpack: (config, { isServer }) => {
    // Handle canvas for server-side rendering
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    
    // Prevent issues with 3D libraries on server side
    if (isServer) {
      config.externals.push({
        'three': 'three',
        '@react-three/fiber': '@react-three/fiber',
        '@react-three/drei': '@react-three/drei',
        'maath': 'maath'
      });
    }
    
    // Handle ES modules properly
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });
    
    return config;
  },
};

export default nextConfig;
