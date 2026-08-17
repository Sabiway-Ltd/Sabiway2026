from rest_framework.pagination import PageNumberPagination


class PostPagination(PageNumberPagination):
    """Bounded feed pagination for SabiForum and bookmark/post lists."""

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


class ReplyPagination(PageNumberPagination):
    """Bounded reply pagination for conversation threads."""

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50
