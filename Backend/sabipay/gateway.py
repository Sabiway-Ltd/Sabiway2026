import hashlib
import hmac

import requests
from django.conf import settings

from operations.analytics import record_technical_metric


class PaystackError(Exception):
    pass


class PaystackConfigurationError(PaystackError):
    pass


def _secret_key():
    key = getattr(settings, "PAYSTACK_SECRET_KEY", "")
    if not key:
        raise PaystackConfigurationError("PAYSTACK_SECRET_KEY is not configured.")
    return key


def paystack_request(method, path, *, payload=None, params=None):
    url = f"{getattr(settings, 'PAYSTACK_BASE_URL', 'https://api.paystack.co').rstrip('/')}/{path.lstrip('/')}"
    route = path.split("?")[0][:120]
    try:
        response = requests.request(method,url,json=payload,params=params,headers={"Authorization":f"Bearer {_secret_key()}","Content-Type":"application/json"},timeout=getattr(settings,"PAYSTACK_TIMEOUT_SECONDS",12))
        data = response.json()
    except (requests.RequestException, ValueError) as exc:
        try: record_technical_metric("payment_provider", route=route, success=False, metadata={"error_code":"network_or_invalid_response"})
        except Exception: pass
        raise PaystackError("Paystack could not be reached safely. Please retry.") from exc
    success = response.status_code < 400 and bool(data.get("status"))
    try: record_technical_metric("payment_provider", route=route, status_code=response.status_code, success=success)
    except Exception: pass
    if not success:
        raise PaystackError(data.get("message") or "Paystack request failed.")
    return data.get("data") or {}


def verify_webhook_signature(raw_body, signature):
    if not signature: return False
    digest = hmac.new(_secret_key().encode("utf-8"), raw_body, hashlib.sha512).hexdigest()
    return hmac.compare_digest(digest, signature)


def initialize_payment(*, email, amount_subunit, reference, callback_url, metadata):
    return paystack_request("POST","/transaction/initialize",payload={"email":email,"amount":str(amount_subunit),"currency":"NGN","reference":reference,"callback_url":callback_url,"metadata":metadata})

def verify_payment(reference): return paystack_request("GET", f"/transaction/verify/{reference}")
def list_banks(): return paystack_request("GET", "/bank", params={"country":"nigeria","currency":"NGN","perPage":100})
def resolve_account(account_number, bank_code): return paystack_request("GET","/bank/resolve",params={"account_number":account_number,"bank_code":bank_code})

def create_transfer_recipient(*, name, account_number, bank_code, metadata):
    return paystack_request("POST","/transferrecipient",payload={"type":"nuban","name":name,"account_number":account_number,"bank_code":bank_code,"currency":"NGN","metadata":metadata})

def initiate_transfer(*, amount_subunit, recipient_code, reference, reason):
    return paystack_request("POST","/transfer",payload={"source":"balance","amount":amount_subunit,"recipient":recipient_code,"reference":reference,"reason":reason})
def verify_transfer(reference): return paystack_request("GET",f"/transfer/verify/{reference}")
def initiate_refund(*, transaction_reference, amount_subunit, reason):
    return paystack_request("POST","/refund",payload={"transaction":transaction_reference,"amount":amount_subunit,"currency":"NGN","customer_note":reason[:240],"merchant_note":reason[:240]})
