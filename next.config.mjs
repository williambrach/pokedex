/** @type {import('next').NextConfig} */
const nextConfig = {
  // We render plain <img> tags (faithful to the original app), so no next/image
  // remote-pattern config is required. Card art comes from the Pokémon TCG API
  // and jsDelivr; user photos are served via short-lived Supabase signed URLs.
  reactStrictMode: true,
};

export default nextConfig;
