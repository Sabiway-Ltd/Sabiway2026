import type { DemoRole, DemoScenario } from "./session";

export type DemoCard = {
  id: string;
  title: string;
  description: string;
  meta: string;
  status: "active" | "waiting" | "complete" | "attention";
};

export type DemoWorkspace = {
  role: DemoRole;
  persona: {
    name: string;
    username: string;
    location: string;
    headline: string;
  };
  metrics: Array<{ label: string; value: string; note: string }>;
  primary: DemoCard[];
  messages: DemoCard[];
  bookings: DemoCard[];
  notifications: DemoCard[];
  trust: DemoCard[];
};

const clientDefault: DemoWorkspace = {
  role: "client",
  persona: {
    name: "Amina Bello",
    username: "@amina.demo",
    location: "Manchester, United Kingdom",
    headline: "Client demo · finding and managing trusted local services",
  },
  metrics: [
    { label: "Active jobs", value: "2", note: "1 awaiting responses" },
    { label: "Upcoming bookings", value: "1", note: "Saturday · 10:00" },
    { label: "Unread messages", value: "3", note: "Across 2 conversations" },
  ],
  primary: [
    { id: "client-job-1", title: "Bathroom tap replacement", description: "Need a leaking mixer tap diagnosed and replaced if required.", meta: "Manchester · Plumbing · £80–£140", status: "active" },
    { id: "client-job-2", title: "Living-room wall repaint", description: "Two walls, neutral colour, materials can be discussed.", meta: "Salford · Painting · Responses open", status: "waiting" },
  ],
  messages: [
    { id: "client-msg-1", title: "David Okafor · Plumbing", description: "I can arrive between 10:00 and 10:30 on Saturday.", meta: "12 min ago · 2 unread", status: "active" },
    { id: "client-msg-2", title: "Grace Mensah · Painting", description: "I’ve reviewed the photos and can quote after confirming wall dimensions.", meta: "Yesterday · 1 unread", status: "waiting" },
  ],
  bookings: [
    { id: "client-booking-1", title: "Tap repair with David Okafor", description: "Booking accepted. Contact sharing is available within the protected booking flow.", meta: "Saturday · 10:00 · £95 estimate", status: "active" },
  ],
  notifications: [
    { id: "client-note-1", title: "New response to your painting job", description: "A Professional sent a proposal for your review.", meta: "Today", status: "attention" },
  ],
  trust: [
    { id: "client-trust-1", title: "Payment protection", description: "Demo transaction states show how SabiPay should communicate holds, releases and disputes.", meta: "Demo evidence only", status: "complete" },
  ],
};

const professionalDefault: DemoWorkspace = {
  role: "professional",
  persona: {
    name: "David Okafor",
    username: "@david.demo",
    location: "Manchester, United Kingdom",
    headline: "Professional demo · services, opportunities, bookings and reputation",
  },
  metrics: [
    { label: "Open leads", value: "5", note: "2 strong matches" },
    { label: "Upcoming bookings", value: "3", note: "Next: Saturday · 10:00" },
    { label: "Pending earnings", value: "£285", note: "Demo SabiPay balance" },
  ],
  primary: [
    { id: "pro-lead-1", title: "Bathroom tap replacement", description: "Local Client needs diagnosis and possible mixer-tap replacement.", meta: "Manchester · 2.4 miles · £80–£140", status: "active" },
    { id: "pro-service-1", title: "Residential plumbing repairs", description: "Your primary service listing is ready for review in this demo scenario.", meta: "In person · From £65", status: "complete" },
  ],
  messages: [
    { id: "pro-msg-1", title: "Amina Bello · Tap repair", description: "Saturday morning works for me. Can we confirm 10:00?", meta: "8 min ago · 1 unread", status: "active" },
  ],
  bookings: [
    { id: "pro-booking-1", title: "Tap repair · Amina Bello", description: "Accepted booking with schedule and payment state visible.", meta: "Saturday · 10:00 · £95 estimate", status: "active" },
    { id: "pro-booking-2", title: "Kitchen sink inspection", description: "Completed job awaiting Client review.", meta: "Completed yesterday", status: "complete" },
  ],
  notifications: [
    { id: "pro-note-1", title: "New nearby opportunity", description: "A plumbing job matching your service area has been posted.", meta: "Today", status: "attention" },
  ],
  trust: [
    { id: "pro-trust-1", title: "Verification status", description: "Identity review approved in the default demo scenario; service moderation remains a separate status.", meta: "Demo trust state", status: "complete" },
    { id: "pro-trust-2", title: "4.9 reputation", description: "27 completed-work reviews shown as deterministic fixture evidence.", meta: "Demo reputation", status: "complete" },
  ],
};

function scenarioWorkspace(base: DemoWorkspace, scenario: DemoScenario): DemoWorkspace {
  if (scenario === "default") return base;
  if (scenario === "empty") {
    return {
      ...base,
      metrics: base.metrics.map((metric) => ({ ...metric, value: "0", note: "Nothing here yet" })),
      primary: [],
      messages: [],
      bookings: [],
      notifications: [],
      trust: base.trust,
    };
  }
  return {
    ...base,
    primary: [],
    messages: [],
    bookings: [],
    notifications: [
      { id: `${base.role}-error`, title: "Demo data unavailable", description: "This deterministic state is used to inspect retry, recovery and outage communication without breaking production APIs.", meta: "Simulated error state", status: "attention" },
    ],
  };
}

export function getDemoWorkspace(role: DemoRole, scenario: DemoScenario = "default") {
  return scenarioWorkspace(role === "professional" ? professionalDefault : clientDefault, scenario);
}
