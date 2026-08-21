import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const baseUrl = process.env.BROWSER_TEST_BASE_URL || "http://127.0.0.1:3100";
const chrome = process.env.CHROME_BIN || "google-chrome";

async function dump(path) {
  const { stdout } = await execFileAsync(
    chrome,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--virtual-time-budget=3000",
      "--dump-dom",
      `${baseUrl}${path}`,
    ],
    { maxBuffer: 8 * 1024 * 1024 },
  );
  return stdout;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const homepage = await dump("/");
  assert(homepage.includes("Find the right professional for the job"), "homepage discovery-first headline did not render");
  assert(homepage.includes('action="/marketplace"'), "homepage marketplace search form did not render");
  assert(homepage.includes("Browse services"), "homepage public browse CTA did not render");
  assert(!homepage.includes("Your location is not the same thing as the service location"), "old architecture-heavy homepage content returned");

  const publicServices = await dump("/services");
  assert(!publicServices.includes("Sign in and continue your journey"), "/services unexpectedly rendered the login page");
  assert(publicServices.toLowerCase().includes("service"), "/services did not render service discovery content");

  const publicClients = await dump("/for-clients");
  assert(!publicClients.includes("Sign in and continue your journey"), "/for-clients unexpectedly rendered the login page");
  assert(publicClients.includes("For clients") || publicClients.includes("For Clients"), "/for-clients did not render the Client acquisition page");

  // The workflow's curl assertion verifies unauthenticated /home returns the
  // expected middleware Location header and preserves the full `next` value.
  const genericLogin = await dump("/login");
  assert(genericLogin.includes("Choose sign-in journey"), "generic login did not expose the Client/Professional choice");

  const professionalLogin = await dump("/login/professional");
  assert(professionalLogin.includes("Continue as a Professional"), "Professional login route did not render role-specific context");

  const clientLogin = await dump("/login/client");
  assert(clientLogin.includes("Continue as a Client"), "Client login route did not render role-specific context");

  const professionalSignup = await dump("/signup/professional");
  assert(professionalSignup.includes("Create your Professional account"), "Professional signup route did not preserve role intent");

  const clientSignup = await dump("/signup/client");
  assert(clientSignup.includes("Create your Client account"), "Client signup route did not preserve role intent");

  const unsafeNext = await dump("/login/client?next=https://example.com");
  assert(unsafeNext.includes("Continue as a Client"), "role-specific login page did not render for unsafe return-intent test");

  console.log("Browser access, homepage and role-entry regression suite passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
