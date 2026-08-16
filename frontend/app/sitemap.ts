export default function sitemap() {
  const lastModified = new Date();
  const routes = [
    "",
    "/marketplace",
    "/community",
    "/about-us",
    "/helpcenter",
    "/privacy-policy",
    "/terms-of-use",
  ];

  return routes.map((route) => ({
    url: `https://www.sabiway.com${route}`,
    lastModified,
  }));
}
