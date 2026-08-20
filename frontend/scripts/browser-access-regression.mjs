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
  const publicServices = await dump("/services");
  assert(!publicServices.includes("Sign in and continue your journey"), "/services unexpectedly rendered the login page");
  assert(publicServices.toLowerCase().includes("service"), "/services did not render service discovery content");

  const publicClients = await dump("/for-clients");
  assert(!publicClients.includes("Sign in and continue your journey"), "/for-clients unexpectedly rendered the login page");
  assert(publicClients.includes("For clients") || publicClients.includes("For Clients"), "/for-clients did not render the Client acquisition page");

  const protectedHome = await dump("/home?source=browser-regression");
  assert(protectedHome.includes("Sign in and continue your journey"), "/home did not redirect an unauthenticated browser to login");

  const professionalSignup = await dump("/signup?role=professional");
  assert(professionalSignup.includes("Sign Up as Professional"), "Professional signup did not preserve role intent");

  const clientSignup = await dump("/signup?role=client");
  assert(clientSignup.includes("Sign Up as Client"), "Client signup did not preserve role intent");

  const unsafeNext = await dump("/login?next=https://example.com");
  assert(unsafeNext.includes("Sign in and continue your journey"), "login page did not render for unsafe return-intent test");

  console.log("Browser access regression suite passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
