module.exports = {
  siteUrl: `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
  generateRobotsTxt: true,
  additionalPaths: async (config) => [
    await config.transform(config, '/locale'),
    await config.transform(config, '/privacy-policy'),
  ],
}