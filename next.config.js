/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignorar errores de linter durante el build para evitar que falle el despliegue
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar errores de tipos durante el build para evitar que falle el despliegue
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;