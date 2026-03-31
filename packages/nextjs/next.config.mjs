const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/python-api/:path*",
        destination: "http://localhost:8000/:path*",
      },
    ];
  },
};

export default nextConfig;
