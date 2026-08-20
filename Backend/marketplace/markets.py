from dataclasses import dataclass


@dataclass(frozen=True)
class Market:
    country_code: str
    name: str
    currency: str
    priority: bool = False


MARKETS = {
    "NG": Market("NG", "Nigeria", "NGN", True),
    "GB": Market("GB", "United Kingdom", "GBP", True),
    "US": Market("US", "United States", "USD"),
    "CA": Market("CA", "Canada", "CAD"),
    "IE": Market("IE", "Ireland", "EUR"),
    "FR": Market("FR", "France", "EUR"),
    "DE": Market("DE", "Germany", "EUR"),
    "ES": Market("ES", "Spain", "EUR"),
    "IT": Market("IT", "Italy", "EUR"),
    "NL": Market("NL", "Netherlands", "EUR"),
    "BE": Market("BE", "Belgium", "EUR"),
    "PT": Market("PT", "Portugal", "EUR"),
    "GH": Market("GH", "Ghana", "GHS"),
    "ZA": Market("ZA", "South Africa", "ZAR"),
    "KE": Market("KE", "Kenya", "KES"),
    "AE": Market("AE", "United Arab Emirates", "AED"),
    "AU": Market("AU", "Australia", "AUD"),
}

COUNTRY_ALIASES = {
    "nigeria": "NG", "ng": "NG",
    "united kingdom": "GB", "uk": "GB", "gb": "GB", "great britain": "GB", "britain": "GB", "england": "GB", "scotland": "GB", "wales": "GB", "northern ireland": "GB",
    "united states": "US", "united states of america": "US", "usa": "US", "us": "US",
    "canada": "CA", "ca": "CA",
    "ireland": "IE", "ie": "IE",
    "france": "FR", "fr": "FR",
    "germany": "DE", "de": "DE",
    "ghana": "GH", "gh": "GH",
    "south africa": "ZA", "za": "ZA",
    "kenya": "KE", "ke": "KE",
    "united arab emirates": "AE", "uae": "AE", "ae": "AE",
    "australia": "AU", "au": "AU",
}


def normalise_country_code(value: str) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    upper = raw.upper()
    if len(upper) == 2 and upper.isalpha():
        return upper
    return COUNTRY_ALIASES.get(raw.lower(), "")


def market_for_country(value: str):
    code = normalise_country_code(value)
    return MARKETS.get(code)


def default_currency_for_country(value: str) -> str:
    market = market_for_country(value)
    return market.currency if market else ""


def country_name_for_code(value: str) -> str:
    code = normalise_country_code(value)
    market = MARKETS.get(code)
    return market.name if market else ""


def supported_currency(value: str) -> bool:
    code = (value or "").strip().upper()
    return len(code) == 3 and code.isalpha()
