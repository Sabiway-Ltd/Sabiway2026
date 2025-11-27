from rest_framework.pagination import PageNumberPagination

class NotificationPagination(PageNumberPagination):
    page_size = 10  # default items per page
    page_size_query_param = "page_size"  # allow client to override
    max_page_size = 50  # max items per page
