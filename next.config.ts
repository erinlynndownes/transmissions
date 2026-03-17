import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  serverExternalPackages: ["@anthropic-ai/sdk"],
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME,
    DYNAMODB_STATS_TABLE_NAME: process.env.DYNAMODB_STATS_TABLE_NAME,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  },
};

export default withNextIntl(nextConfig);
