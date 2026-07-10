import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // Garantindo que erros de tipo parem o build para evitar bugs em produção
    ignoreBuildErrors: false,
  },
  eslint: {
    // Garantindo que avisos de segurança e linting sejam respeitados
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
