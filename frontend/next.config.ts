import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF first, WebP as the fallback for older engines.
    formats: ["image/avif", "image/webp"],
    // Next 16 only serves allowlisted quality values and coerces anything else
    // to the nearest entry, so the hero photograph's 82 has to be listed.
    qualities: [60, 75, 82],
  },
};

export default nextConfig;
