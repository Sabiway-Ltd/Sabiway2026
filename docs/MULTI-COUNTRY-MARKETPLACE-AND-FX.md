# Multi-country marketplace and FX architecture

## Product model

SabiWay is a **global location-based services marketplace**. Nigeria and the United Kingdom are the first optimised markets; they are not hard architectural boundaries.

The system must keep these concepts independent:

1. account location;
2. preferred/default search location;
3. service or job location;
4. Professional base location;
5. Professional service area;
6. service currency;
7. Client payment currency;
8. Professional payout currency.

Never infer one of these solely from another.

## Core examples

- UK Client → UK Professional for a UK service.
- Nigeria Client → Nigeria Professional for a Nigeria service.
- UK Client → Nigeria Professional when the work is in Nigeria.
- Nigeria Client → UK Professional when the work is in the UK.
- US Client → US Professional when US supply exists.
- Remote Professional → Client in another country when the service supports remote delivery.

A user's nationality is not a marketplace routing rule.

## Launch focus versus global capability

### Optimised first

- Nigeria (`NG`) / NGN.
- United Kingdom (`GB`) / GBP.

### Global discovery

Professionals in other countries may register and become discoverable where they operate. Market-by-market payment and payout support can lag discovery support.

## Country and currency catalogue

`Backend/markets/catalog.py` owns the current canonical market catalogue and aliases.

The marketplace keeps the existing human-readable `country` field for backwards compatibility. The markets layer canonicalises recognised country aliases and associates them with ISO-style country codes and the market's normal service currency.

Examples:

- `UK`, `GB`, `United Kingdom` → `GB`, `United Kingdom`, `GBP`.
- `Nigeria`, `NG` → `NG`, `Nigeria`, `NGN`.
- `USA`, `US`, `United States` → `US`, `United States`, `USD`.

For recognised markets, a ServiceListing or JobPosting is normalised to the market currency server-side. This removes the previous client-side assumption that every listing/job is NGN.

## Location preference

`UserLocationPreference` is separate from the Profile's account/base location.

API:

- `GET /api/markets/location-preference/`
- `PUT /api/markets/location-preference/`

The purpose is to support a default marketplace such as "services near Preston" without preventing the user from changing the service location to Lagos, London, New York, or any other place with supply.

## Service areas and nearby discovery

`ListingServiceArea` creates a service-area layer around a ServiceListing. It supports:

- canonical country code and country name;
- state/region;
- city;
- area;
- postal code;
- latitude/longitude;
- service radius in kilometres.

Existing listings automatically receive a service-area record when they are saved. Coordinates remain optional until provided by a geocoding/location UX.

Nearby discovery endpoint:

`GET /api/markets/nearby-services/?lat=<lat>&lng=<lng>&radius_km=25&country_code=GB`

The endpoint uses a bounding box and proximity ordering. It does not expose an exact private home address.

Text-based marketplace location filters remain available and are still useful when coordinates are unknown.

## Remote services

The existing marketplace delivery modes remain authoritative:

- `in_person`;
- `remote`;
- `both`.

For in-person services, location should strongly influence discovery. For remote services, category/skill/trust/availability may be more important than physical proximity.

## Multi-currency transaction model

Cross-border payments must preserve three distinct monetary views:

- **service currency** — currency in which the work was agreed;
- **payment currency** — currency the Client actually pays;
- **payout currency** — currency the Professional receives.

Example:

- service: NGN 150,000;
- Client pays: GBP equivalent;
- Professional payout: NGN.

The system must never overwrite the original service price with only the converted amount.

## FX quote snapshots

`FxQuote` records:

- service amount/currency;
- Client payment amount/currency;
- Professional payout amount/currency;
- FX rate;
- FX fee;
- provider;
- quote timestamp;
- expiry timestamp;
- status.

API:

`POST /api/markets/fx-quote/`

Example request:

```json
{
  "service_amount": "100.00",
  "service_currency": "GBP",
  "payment_currency": "NGN",
  "payout_currency": "GBP"
}
```

Same-currency quotes always resolve at 1:1.

Cross-currency quotes **fail closed** unless an FX provider is configured. This is deliberate: SabiWay must not invent exchange rates or take untracked treasury risk.

## Development FX provider

For local/CI testing only:

```env
FX_PROVIDER=static
FX_STATIC_RATES={"GBP_NGN":2100}
FX_QUOTE_TTL_MINUTES=10
FX_FEE_RATE=0
```

Static FX is blocked in production unless `FX_ALLOW_STATIC_IN_PRODUCTION=True`, which should not be enabled for a real release.

A production integration should replace this with an authorised payment/FX provider adapter.

## Payment orchestration boundary

SabiPay should evolve from a direct Paystack assumption to this contract:

```text
SabiPay
  -> market/payment orchestration
      -> payment provider for payer market
      -> FX provider where currencies differ
      -> payout provider for Professional market
```

The application-level operations should remain provider-neutral:

- create payment;
- obtain/lock FX quote;
- verify payment;
- refund payment;
- create payout;
- verify payout.

## Current payment activation status

Marketplace discovery is broader than payment activation.

Current catalogue marks:

- Nigeria: marketplace enabled, payment/payout capability enabled through the existing Nigeria/Paystack path.
- United Kingdom: marketplace enabled and optimised; payment/payout activation still requires an approved GBP-capable provider configuration.
- other recognised markets: marketplace discovery may operate; payment/payout remains disabled until configured.

Do not tell users that SabiPay supports a market merely because marketplace discovery supports that market.

## Cross-border settlement evidence

`CrossBorderPaymentContext` is the immutable transaction-level record reserved for a funded multi-currency SabiPay transaction. It preserves the service, payer and payout amounts/currencies and the FX quote used.

A future payment-provider integration must create this record when an FX quote is consumed by a real transaction.

## Refund rule

Refunds should reference the original payment transaction and provider rather than recalculating a new exchange rate in application code. Preserve the original quote and gateway references for support, disputes and reconciliation.

## Security and compliance rule

SabiWay must not behave as an unlicensed currency dealer. The platform controls transaction state and records evidence; authorised payment/FX providers perform regulated money movement and conversion.

## API summary

- `GET /api/markets/` — public market capability catalogue.
- `GET/PUT /api/markets/location-preference/` — authenticated default search location.
- `GET /api/markets/nearby-services/` — coordinate/radius discovery.
- `POST /api/markets/fx-quote/` — authenticated quote snapshot; cross-currency fails closed without provider configuration.

Versioned equivalents also exist under `/api/v1/markets/`.

## Non-negotiable invariants

- account location must never force job/service location;
- Client location must never force Professional location;
- service currency must remain visible even if Client pays another currency;
- remote services must not be incorrectly hidden by local-only discovery;
- unsupported payment markets must fail clearly rather than silently converting or charging;
- Nigeria/UK launch focus must not become a global product restriction.
