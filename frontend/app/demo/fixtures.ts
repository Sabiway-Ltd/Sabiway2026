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
  payments: DemoCard[];
  community: DemoCard[];
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
  payments: [
    { id: "client-pay-1", title: "£95 held for tap repair", description: "Demo SabiPay state showing funds held until the booking moves through the agreed completion flow.", meta: "Protected payment · Demo only", status: "active" },
    { id: "client-pay-2", title: "£140 released for appliance repair", description: "Completed transaction fixture used to inspect receipts, history and dispute-entry context.", meta: "Released 8 Aug · Demo only", status: "complete" },
  ],
  community: [
    { id: "client-community-1", title: "How do you compare quotes fairly?", description: "A SabiForum discussion about scope, materials, trust evidence and avoiding price-only decisions.", meta: "12 replies · Home services", status: "active" },
    { id: "client-community-2", title: "Saved local-service checklist", description: "Community insight fixture showing how educational content can support marketplace decisions.", meta: "Saved · Demo content", status: "complete" },
  ],
  notifications: [
    { id: "client-note-1", title: "New response to your painting job", description: "A Professional sent a proposal for your review.", meta: "Today", status: "attention" },
  ],
  trust: [
    { id: "client-trust-1", title: "Payment protection", description: "Demo transaction states show how SabiPay should communicate holds, releases and disputes.", meta: "Demo evidence only", status: "complete" },
    { id: "client-review-1", title: "Your review of appliance repair", description: "4.8/5 review fixture tied to completed work rather than an unverified profile endorsement.", meta: "Completed-work review · Demo", status: "complete" },
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
  payments: [
    { id: "pro-pay-1", title: "£285 pending release", description: "Demo earnings fixture showing protected funds across completed and in-progress bookings.", meta: "SabiPay demo balance", status: "waiting" },
    { id: "pro-pay-2", title: "£420 available earnings", description: "Released balance fixture used to inspect payout and transaction-history hierarchy.", meta: "Available · Demo only", status: "complete" },
  ],
  community: [
    { id: "pro-community-1", title: "Plumbing Professionals: quoting hidden faults", description: "SabiForum fixture about communicating uncertainty without creating misleading fixed-price expectations.", meta: "18 replies · Professional practice", status: "active" },
    { id: "pro-community-2", title: "Your answer helped 14 members", description: "Contribution/reputation fixture separated from completed-work review reputation.", meta: "Community contribution · Demo", status: "complete" },
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
      payments: [],
      community: [],
      notifications: [],
      trust: base.trust,
    };
  }
  return {
    ...base,
    primary: [],
    messages: [],
    bookings: [],
    payments: [],
    community: [],
    notifications: [
      { id: `${base.role}-error`, title: "Demo data unavailable", description: "This deterministic state is used to inspect retry, recovery and outage communication without breaking production APIs.", meta: "Simulated error state", status: "attention" },
    ],
  };
}

export function getDemoWorkspace(role: DemoRole, scenario: DemoScenario = "default") {
  return scenarioWorkspace(role === "professional" ? professionalDefault : clientDefault, scenario);
}
