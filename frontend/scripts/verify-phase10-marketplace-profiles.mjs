import { access, readFile } from "node:fs/promises";

const failures = [];
const read = async (path) => readFile(new URL(path, import.meta.url), "utf8");

const marketplacePage = await read("../app/marketplace/page.tsx");
const marketplace = await read("../app/marketplace/MarketplaceExperience.tsx");
const marketplaceShell = await read("../app/marketplace/MarketplaceShell.tsx");
const defaultLocation = await read("../app/marketplace/MarketplaceDefaultLocation.tsx");
const publicProfile = await read("../app/profile/[username]/page.tsx");
const contact = await read("../app/profile/[username]/ServiceContactButton.tsx");
const backendView = await read("../../Backend/profiles/public_views.py");
const backendUrls = await read("../../Backend/profiles/urls.py");
const backendTests = await read("../../Backend/profiles/test_public_marketplace_profile.py");

for (const path of [
  "../app/marketplace/MarketplaceExperience.tsx",
  "../app/profile/[username]/ServiceContactButton.tsx",
  "../../Backend/profiles/public_views.py",
  "../../Backend/profiles/test_public_marketplace_profile.py",
]) {
  try { await access(new URL(path, import.meta.url)); } catch { failures.push(`missing Phase 10 file ${path}`); }
}

for (const contract of [
  "Promise.allSettled",
  "availability:",
  "MarketplaceExperience",
  "initialQuery={params.q}",
  "initialLocation={params.location}",
  "initialCategory={params.category}",
]) {
  if (!marketplacePage.includes(contract)) failures.push(`marketplace SSR missing ${contract}`);
}
if (marketplacePage.includes("return { listings: [], jobs: [], categories: [] }")) failures.push("marketplace SSR must not collapse backend failure into a genuine empty result");
if (marketplacePage.includes("MarketplaceClient")) failures.push("rendered marketplace must not fall back to the legacy monolithic MarketplaceClient");

for (const contract of [
  'role === "professional"',
  'const endpoint = professionalMode ? "jobs" : "listings"',
  "/api/marketplace/${endpoint}/",
  "Find the right Professional for the work.",
  "Find work that fits your services.",
  "/api/marketplace/job-responses/",
  "View Professional profile",
  "ServiceContactButton",
  "Verified identity",
  "A genuine empty result is different from marketplace unavailability.",
]) {
  if (!marketplace.includes(contract)) failures.push(`role-aware marketplace missing ${contract}`);
}

for (const source of [marketplace, marketplaceShell, defaultLocation, contact]) {
  for (const forbidden of ["localStorage.getItem(\"access\")", "localStorage.setItem(\"access\")", "document.cookie"] ) {
    if (source.includes(forbidden)) failures.push(`Phase 10 marketplace/profile flow must not use direct auth primitive ${forbidden}`);
  }
}

for (const contract of [
  "PublicShell",
  "/api/profiles/public/",
  "Approved services",
  "Trust context",
  "Verified Professional",
  "Completed-work reputation",
  "No completed-work reviews yet",
  "ServiceContactButton",
  "SabiForum activity",
  "Community posts can help",
]) {
  if (!publicProfile.includes(contract)) failures.push(`public Professional storefront missing ${contract}`);
}
for (const forbidden of ["phone_number", "date_of_birth", "street", "address", "followers_count", "★★★★★"]) {
  if (publicProfile.includes(forbidden)) failures.push(`public Professional storefront must not expose/invent ${forbidden}`);
}

for (const contract of [
  "useAuthStore",
  "/login/client?next=",
  "listing_id: listingId",
  "/api/marketplace/threads/",
  "searchParams.get(\"contact\") === listingId",
]) {
  if (!contact.includes(contract)) failures.push(`service contact resume flow missing ${contract}`);
}

for (const contract of [
  "permission_classes = [permissions.AllowAny]",
  "ProfileSerializer(profile, context={\"request\": request})",
  "ServiceListing.ModerationStatus.APPROVED",
  "is_active=True",
  "VerificationSubmission.Status.APPROVED",
  "PublicProfessionalReviewSerializer",
]) {
  if (!backendView.includes(contract)) failures.push(`public marketplace profile backend missing ${contract}`);
}
if (!backendUrls.includes('path("public/<str:username>/"')) failures.push("public marketplace profile URL missing");
for (const contract of [
  "test_public_profile_is_available_without_authentication",
  "test_public_profile_strips_private_identity_fields",
  "test_only_approved_active_services_are_returned",
  "test_unknown_public_profile_returns_not_found",
]) {
  if (!backendTests.includes(contract)) failures.push(`public profile backend test missing ${contract}`);
}

if (failures.length) {
  console.error("Phase 10 marketplace and Professional profile contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Phase 10 marketplace discovery and public Professional profile contract passed while allowing Phase 14 to evolve trust evidence into backend-derived verification and completed-work reputation.");
await import("./verify-phase11-jobs-leads-proposals.mjs");
