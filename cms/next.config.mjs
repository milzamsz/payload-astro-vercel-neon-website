import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Payload admin lives in this app; the public site is the separate `web/` Astro app.
  reactStrictMode: true,
}

export default withPayload(nextConfig)
