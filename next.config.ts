import type { NextConfig } from 'next'

const config: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/c-ced7723b838bd9dbf940dffe6eee3c/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
}

export default config
