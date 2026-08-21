export type DemoRole = "client" | "professional";
export type DemoScenario = "default" | "empty" | "error";

export type DemoSession = {
  kind: "sabiway_demo";
  role: DemoRole;
  scenario: DemoScenario;
  startedAt: string;
};

const DEMO_SESSION_KEY = "sabiway_demo_session_v1";

export function demoModeEnabled() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export function createDemoSession(role: DemoRole, scenario: DemoScenario = "default"): DemoSession {
  if (!demoModeEnabled()) throw new Error("SabiWay demo mode is not enabled.");
  return { kind: "sabiway_demo", role, scenario, startedAt: new Date().toISOString() };
}

export function writeDemoSession(session: DemoSession) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
}

export function readDemoSession(): DemoSession | null {
  if (typeof window === "undefined" || !demoModeEnabled()) return null;
  const raw = window.sessionStorage.getItem(DEMO_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DemoSession>;
    if (
      parsed.kind !== "sabiway_demo" ||
      (parsed.role !== "client" && parsed.role !== "professional") ||
      !["default", "empty", "error"].includes(String(parsed.scenario))
    ) {
      window.sessionStorage.removeItem(DEMO_SESSION_KEY);
      return null;
    }
    return parsed as DemoSession;
  } catch {
    window.sessionStorage.removeItem(DEMO_SESSION_KEY);
    return null;
  }
}

export function clearDemoSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(DEMO_SESSION_KEY);
}

export function assertDemoIsolation() {
  if (typeof window === "undefined") return true;
  const forbiddenKeys = ["access", "refresh", "user", "internal_review_mode"];
  return forbiddenKeys.every((key) => !window.sessionStorage.getItem(key));
}
