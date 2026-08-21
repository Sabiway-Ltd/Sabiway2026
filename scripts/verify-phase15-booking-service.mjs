import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const checks = [];

function check(label, pass, detail) {
  checks.push({ label, pass: Boolean(pass), detail });
}
function requirePath(label, relativePath) {
  check(label, exists(relativePath), relativePath);
}
function requireText(label, relativePath, markers) {
  if (!exists(relativePath)) return check(label, false, `${relativePath} missing`);
  const content = read(relativePath);
  const missing = markers.filter((marker) => !content.includes(marker));
  check(label, missing.length === 0, missing.length ? `${relativePath}: missing ${missing.join(", ")}` : relativePath);
}
function rejectText(label, relativePath, markers) {
  if (!exists(relativePath)) return check(label, false, `${relativePath} missing`);
  const content = read(relativePath);
  const present = markers.filter((marker) => content.includes(marker));
  check(label, present.length === 0, present.length ? `${relativePath}: contains ${present.join(", ")}` : relativePath);
}

requirePath("Phase 15 audit exists", "docs/PHASE-15-BOOKING-SCHEDULING-SERVICE-MANAGEMENT-AUDIT.md");
requirePath("Phase 15 capability authority exists", "Backend/marketplace/booking_capabilities.py");
requirePath("Phase 15 authority tests exist", "Backend/marketplace/test_phase15_booking_capabilities.py");

requireText("Booking capability endpoint is participant scoped", "Backend/marketplace/booking_capabilities.py", [
  ".filter(Q(client=me) | Q(professional=me))",
  '"available_status_transitions"',
  '"can_propose_schedule"',
  '"can_respond_to_active_schedule"',
]);
requireText("Booking capabilities obey SabiPay funded-work authority", "Backend/marketplace/booking_capabilities.py", [
  "Transaction.State.FUNDED",
  "Transaction.State.IN_PROGRESS",
  "BookingRequest.Status.IN_PROGRESS in transitions",
  "BookingRequest.Status.COMPLETED in transitions",
  '"payment_state"',
]);
requireText("Backend preserves participant booking transition authority", "Backend/marketplace/views.py", [
  "Only the job owner can shortlist or decline responses.",
  "Invalid booking status transition.",
  "booking.save(update_fields=[\"status\", \"accepted_at\", \"updated_at\"])",
]);
requireText("Backend preserves schedule negotiation authority", "Backend/marketplace/views.py", [
  "The other participant must respond to this proposal.",
  "This proposal is no longer active.",
  "ScheduleProposal.Status.SUPERSEDED",
]);
requireText("Schedule proposals remain future-only and participant-scoped", "Backend/marketplace/serializers.py", [
  "You are not part of this booking.",
  "The booking must be accepted before scheduling.",
  "Schedule must be in the future.",
]);

requireText("Bookings workspace consumes server capabilities", "frontend/app/bookings/page.tsx", [
  'api.get<BookingCapability[]>("/marketplace/booking-capabilities/")',
  "available_status_transitions",
  "can_propose_schedule",
  "can_respond_to_active_schedule",
  "payment_state",
]);
requireText("Bookings workspace owns service status and scheduling actions", "frontend/app/bookings/page.tsx", [
  "/marketplace/bookings/${booking.id}/status/",
  'api.post("/marketplace/schedule-proposals/"',
  "/marketplace/schedule-proposals/${proposalId}/decision/",
  "Bookings & schedules",
]);
requireText("Messages hands existing bookings to canonical workspace", "frontend/app/messages/MessagesClient.tsx", [
  'href="/bookings"',
  "Open Bookings & schedules",
  "After creation, manage its lifecycle in Bookings & schedules.",
]);
rejectText("Messages no longer owns booking lifecycle transitions", "frontend/app/messages/MessagesClient.tsx", [
  "async function updateBooking",
  "async function proposeSchedule",
  "async function decideSchedule",
  "/schedule-proposals/${proposalId}/decision/",
]);
requireText("Initial booking creation remains conversation-contextual and Client-owned", "frontend/app/messages/MessagesClient.tsx", [
  "async function createBooking",
  "/api/marketplace/bookings/",
  "Create booking summary",
]);

const failed = checks.filter((item) => !item.pass);
for (const item of checks) {
  console.log(`${item.pass ? "PASS" : "FAIL"}  ${item.label} — ${item.detail}`);
}
console.log(`\nPhase 15 booking, scheduling and service-management contract: ${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length) process.exit(1);
