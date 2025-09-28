# docs/views.py
from django.shortcuts import render
from django.views.generic import TemplateView

class AuthDocsView(TemplateView):
    template_name = "docs/auth.html"
