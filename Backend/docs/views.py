# docs/views.py
from django.shortcuts import render
from django.views.generic import TemplateView

class AuthDocsView(TemplateView):
    template_name = "docs/auth.html"

class AuthAdminDocsView(TemplateView):
    template_name = "docs/auth_admin.html"

class ProfilesDocsView(TemplateView):
    template_name = "docs/profiles.html"


class ProfilesAdminDocsView(TemplateView):
    template_name = "docs/profiles_admin.html"


class PostsDocsView(TemplateView):
    template_name = "docs/posts.html"


class PostsAdminDocsView(TemplateView):
    template_name = "docs/posts_admin.html"


class NotificationsDocsView(TemplateView):
    template_name = "docs/notifications.html"



class SearchDocsView(TemplateView):
    template_name = "docs/search.html"
