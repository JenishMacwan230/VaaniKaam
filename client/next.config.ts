import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
  // This is the default (also the `src` folder is supported out of the box)
  './i18n.ts'
);

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
