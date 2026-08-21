import { readFile } from "node:fs/promises";

const failures = [];
const read = async (path) => readFile(new URL(path, import.meta.url), "utf8");

const policy = await read("../app/config/accessPolicy.ts");
const shell = await read("../app/_components/v2/AppShell.tsx");
const notificationsPage = await read("../app/notifications/page.tsx");
const notifications = await read("../app/notifications/AllNotifications.tsx");
const notificationStore = await read("../app/store/useAllNotificationsStore.ts");
const messagesPage = await read("../app/messages/page.tsx");
const messageSerializer = await read("../../Backend/marketplace/serializers.py");

for (const contract of [
  '{ prefix: "/notifications", access: "AUTHENTICATED_SHARED" }',
  '{ prefix: "/messages", access: "PARTICIPANT_SCOPED" }',
  '{ href: "/notifications", label: "Notifications" }',
]) {
  if (!policy.includes(contract)) failures.push(`access/navigation contract missing ${contract}`);
}

for (const contract of ["Notifications: Bell", 'href="/notifications"', 'aria-label="Open notifications"']) {
  if (!shell.includes(contract)) failures.push(`AppShell notification utility missing ${contract}`);
}

for (const contract of ["AppShell", "Activity centre", "Notifications", "AllNotifications"]) {
  if (!notificationsPage.includes(contract)) failures.push(`notification page missing ${contract}`);
}

for (const contract of [
  "safeNotificationLink",
  "target_url?.startsWith",
  'return "/messages"',
  'return "/bookings"',
  'return "/sabipay"',
  "Mark all read",
  "Open context",
  "No notifications yet",
  "Retry",
]) {
  if (!notifications.includes(contract)) failures.push(`notification centre missing ${contract}`);
}
for (const forbidden of ['localStorage.getItem("access")', 'localStorage.setItem("access")', "document.cookie", "CommunityNavbar", "bg-[#008753]"]) {
  if ((notificationsPage + notifications + notificationStore).includes(forbidden)) failures.push(`notification flow must not use ${forbidden}`);
}

for (const contract of ["import { api }", "api.get<NotificationResponse>", "api.patch", "Optimistic", "Notifications are temporarily unavailable."]) {
  if (!notificationStore.includes(contract)) failures.push(`notification shared API contract missing ${contract}`);
}

for (const contract of ["AppShell", "MessagesClient"]) {
  if (!messagesPage.includes(contract)) failures.push(`messages shell contract missing ${contract}`);
}
for (const contract of [
  "if me.pk not in thread.participant_ids()",
  "Contact details cannot be shared before a booking is accepted.",
  "Only the client can create the booking agreement.",
]) {
  if (!messageSerializer.includes(contract)) failures.push(`messaging backend authority missing ${contract}`);
}

if (failures.length) {
  console.error("Phase 13 Messaging & Notifications contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Phase 13 shared notification centre and participant-scoped messaging contract passed.");
