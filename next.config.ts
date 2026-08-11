import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Lets the client Router Cache reuse an already-visited tab's RSC payload
    // for 30s instead of always re-fetching from the server — the bottom-nav
    // tabs (Home/Journey/Team/Profile) are exactly this kind of quick back-
    // and-forth navigation, so this is what makes revisits feel instant.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
