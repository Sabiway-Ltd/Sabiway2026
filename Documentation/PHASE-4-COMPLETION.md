# Phase 4 — Marketplace Foundation

## Outcome

Phase 4 introduces the first marketplace transaction-preparation layer on top of SabiForum. It deliberately stops before money movement: SabiPay, escrow and payment processing remain deferred.

## Delivered

### Marketplace domain
- `ServiceCategory` for governed service taxonomy.
- `ServiceListing` for professional service offers, location, delivery mode and starting price.
- `BookingRequest` for client-to-provider service requests and controlled lifecycle states.
- Seeded starter service categories covering electricians, plumbing, tailoring, hair & beauty, tutors, event services, cleaning, tech support, photography and catering.

### API and permission boundaries
- Public category and active-listing discovery.
- Query filters for text, category, state, area and delivery mode.
- Professional-only listing creation.
- Listing edits/deactivation restricted to the listing owner.
- Booking creation restricted to authenticated users and blocked for a provider's own listing.
- Booking visibility restricted to the client and the listing provider.
- Client status control limited to cancellation.
- Provider status control limited to valid accept/decline/complete transitions.
- Public listing responses reuse the privacy-aware profile serializer, so contact and personal fields are not exposed to anonymous/public marketplace discovery.

### Web
- Responsive `/marketplace` discovery page.
- Client-side search by service, provider, category and state.
- Booking request dialog using the existing JWT session token.
- Professional service-publishing form with server-side permission enforcement.
- Empty and error states suitable for a marketplace that may initially have limited supply.

### Mobile
- Marketplace added alongside SabiForum in the authenticated app navigation.
- Responsive service discovery/search.
- Listing cards show category, provider, location, delivery mode and starting price.
- Authenticated booking request flow.
- API client types for listings and bookings.

### Operations and quality
- Django admin controls for categories, listings and booking requests.
- Initial marketplace migrations plus deterministic starter-category data migration.
- Automated marketplace user-journey tests.
- CI migration-drift check added so model changes cannot silently diverge from migrations.

## Automated journey coverage

The Phase 4 test suite verifies:
1. Anonymous/public discovery can filter active listings.
2. Public provider serialization does not leak email, phone or street details.
3. Non-professional profiles cannot publish services.
4. Professionals can publish services.
5. Non-owners cannot modify another provider's listing.
6. Clients can create booking requests.
7. Providers can accept pending requests.
8. Clients can cancel eligible requests.
9. Providers cannot book their own listings.
10. Unrelated users cannot inspect another user's booking.

## Responsive/device review target

The implementation is designed around the same responsive baseline used in Phase 3:

| Surface | Compact phone | Standard phone | Tablet | Desktop/web |
| --- | --- | --- | --- | --- |
| Marketplace discovery | single-column cards | single-column cards | constrained feed | 2–3 column grid |
| Search/filter controls | stacked | stacked | stacked/expanded | 3-column controls |
| Booking request | bottom modal/sheet | bottom modal/sheet | centred/constrained | centred dialog |
| Provider publish form | stacked | stacked | two-column where space allows | two-column |

No device-specific business rules exist; all surfaces use the same API permission model.

## Explicitly deferred

The following are **not** Phase 4 scope:
- SabiPay, escrow, card/bank payment collection or payout logic.
- Identity/KYC/provider verification.
- Reviews and ratings.
- Dispute resolution and refund workflows.
- Production deployment, Vercel plan changes or Supabase migration.

These require dedicated product/security decisions rather than being silently coupled to the marketplace foundation.

## Release gate

Phase 4 is ready to merge only when all repository CI jobs pass:
- repository hygiene
- Django system check
- migration drift
- accounts/posts/notifications/marketplace tests
- realtime check
- frontend TypeScript
- frontend lint
- mobile TypeScript
- waitlist syntax

The external Vercel build-rate quota remains separate from repository-code verification and does not alter the Phase 4 code scope.
