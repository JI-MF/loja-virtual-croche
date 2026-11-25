
/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "epilogue-erasure-getting.ngrok-free.dev",
  ],

  output: "standalone",

  serverExternalPackages: [
    "@prisma/adapter-mariadb",
    "mariadb",
  ],
};

export default nextConfig;
