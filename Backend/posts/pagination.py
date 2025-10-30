# posts/pagination.py
from rest_framework.pagination import PageNumberPagination

class PostPagination(PageNumberPagination):
    page_size = 20  # You can adjust this (e.g. 10, 15, 30)
    page_size_query_param = "page_size"
    max_page_size = 100


class ReplyPagination(PageNumberPagination):
    page_size = 10  # adjust to your liking
    page_size_query_param = "page_size"
    max_page_size = 50