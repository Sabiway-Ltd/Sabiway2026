from dataclasses import dataclass


@dataclass(frozen=True)
class Market:
    code: str
    name: str
    currency: str
    optimised: bool = False
    marketplace_enabled: bool = True
    payments_enabled: bool = False
    payouts_enabled: bool = False


MARKETS = {
    "NG": Market("NG", "Nigeria", "NGN", optimised=True, payments_enabled=True, payouts_enabled=True),
    "GB": Market("GB", "United Kingdom", "GBP", optimised=True),
    "US": Market("US", "United States", "USD"),
    "CA": Market("CA", "Canada", "CAD"),
    "IE": Market("IE", "Ireland", "EUR"),
    "DE": Market("DE", "Germany", "EUR"),
    "FR": Market("FR", "France", "EUR"),
    "ES": Market("ES", "Spain", "EUR"),
    "IT": Market("IT", "Italy", "EUR"),
    "NL": Market("NL", "Netherlands", "EUR"),
    "BE": Market("BE", "Belgium", "EUR"),
    "PT": Market("PT", "Portugal", "EUR"),
    "AU": Market("AU", "Australia", "AUD"),
    "NZ": Market("NZ", "New Zealand", "NZD"),
    "ZA": Market("ZA", "South Africa", "ZAR"),
    "GH": Market("GH", "Ghana", "GHS"),
    "KE": Market("KE", "Kenya", "KES"),
}

ALIASES = {
    "nigeria": "NG", "ng": "NG",
    "united kingdom": "GB", "uk": "GB", "gb": "GB", "great britain": "GB", "england": "GB", "scotland": "GB", "wales": "GB", "northern ireland": "GB",
    "united states": "US", "united states of america": "US", "usa": "US", "us": "US",
    "canada": "CA", "ca": "CA",
    "ireland": "IE", "ie": "IE",
    "germany": "DE", "de": "DE",
    "france": "FR", "fr": "FR",
    "spain": "ES", "es": "ES",
    "italy": "IT", "it": "IT",
    "netherlands": "NL", "nl": "NL",
    "belgium": "BE", "be": "BE",
    "portugal": "PT", "pt": "PT",
    "australia": "AU", "au": "AU",
    "new zealand": "NZ", "nz": "NZ",
    "south africa": "ZA", "za": "ZA",
    "ghana": "GH", "gh": "GH",
    "kenya": "KE", "ke": "KE",
}


def normalise_country(value: str):
    raw = (value or "").strip()
    if not raw:
        return "", ""
    code = ALIASES.get(raw.casefold())
    if code:
        return code, MARKETS[code].name
    if len(raw) == 2 and raw.upper() in MARKETS:
        market = MARKETS[raw.upper()]
        return market.code, market.name
    return raw[:2].upper() if len(raw) == 2 else "", raw


def market_for_country(value: str):
    code, _ = normalise_country(value)
    return MARKETS.get(code)


def currency_for_country(value: str, requested: str = ""):
    market = market_for_country(value)
    requested = (requested or "").strip().upper()
    if market:
        return market.currency
    return requested if len(requested) == 3 and requested.isalpha() else ""


def public_markets():
    return [
        {
            "code": market.code,
            "name": market.name,
            "currency": market.currency,
            "optimised": market.optimised,
            "marketplace_enabled": market.marketplace_enabled,
            "payments_enabled": market.payments_enabled,
            "payouts_enabled": market.payouts_enabled,
        }
        for market in MARKETS.values()
    ]
