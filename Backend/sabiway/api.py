"""Shared API conventions for SabiWay V2.

These helpers are additive during migration: legacy endpoints keep their current
response shapes until each capability is explicitly migrated and tested.
"""

from collections.abc import Mapping
from typing import Any

from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


class SabiWayPagination(PageNumberPagination):
    """Canonical V2 page-number pagination contract."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response(
            {
                "data": data,
                "meta": {
                    "pagination": {
                        "page": self.page.number,
                        "page_size": self.get_page_size(self.request),
                        "count": self.page.paginator.count,
                        "pages": self.page.paginator.num_pages,
                        "next": self.get_next_link(),
                        "previous": self.get_previous_link(),
                    }
                },
            }
        )


def success_response(data: Any = None, *, meta: Mapping[str, Any] | None = None, status_code: int = status.HTTP_200_OK):
    payload: dict[str, Any] = {"data": data}
    if meta:
        payload["meta"] = dict(meta)
    return Response(payload, status=status_code)


def error_response(code: str, message: str, *, details: Any = None, status_code: int = status.HTTP_400_BAD_REQUEST):
    error: dict[str, Any] = {"code": code, "message": message}
    if details is not None:
        error["details"] = details
    return Response({"error": error}, status=status_code)


def sabiway_exception_handler(exc, context):
    """Canonical V2 exception envelope for endpoints that opt into it.

    Do not enable globally until all current consumers are migrated because
    changing legacy DRF error shapes without coordinating clients is unsafe.
    """

    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    data = response.data
    if isinstance(data, Mapping) and set(data.keys()) == {"detail"}:
        message = str(data["detail"])
        details = None
    else:
        message = "The request could not be completed."
        details = data

    response.data = {
        "error": {
            "code": getattr(exc, "default_code", "request_error"),
            "message": message,
            **({"details": details} if details is not None else {}),
        }
    }
    return response
