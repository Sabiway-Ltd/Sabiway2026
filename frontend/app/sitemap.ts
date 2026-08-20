import { locations, serviceCategories } from "./_components/v2/publicData";

export default function sitemap() {
  const lastModified = new Date();
  const routes = [
    "",
    "/marketplace",
    "/services",
    "/locations",
    "/for-clients",
    "/for-professionals",
    "/how-it-works",
    "/sabiforum",
    "/trust-and-safety",
    "/sabipay-explained",
    "/verification-info",
    "/fees",
    "/download",
    "/contact",
    "/partners",
    "/careers",
    "/accessibility",
    "/about-us",
    "/helpcenter",
    "/privacy-policy",
    "/terms-of-use",
    ...serviceCategories.map(({ slug }) => `/services/${slug}`),
    ...locations.map(({ slug }) => `/locations/${slug}`),
  ];

  return routes.map((route) => ({
    url: `https://www.sabiway.com${route}`,
    lastModified,
  }));
}
