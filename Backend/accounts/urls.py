# accounts/urls.py

from django.urls import path
from .views import SignupView, LoginView, GoogleLoginView, ForgotPasswordView, ConfirmCodeView, ResetPasswordView, LogoutView



urlpatterns = [
    path("signup/", SignupView.as_view(), name="signup"),
    path("login/", LoginView.as_view(), name="login"),
    path("google-login/", GoogleLoginView.as_view(), name="google-login"),
    path("google/callback/", GoogleLoginView.as_view(), name="google-callback"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("confirm-code/", ConfirmCodeView.as_view(), name="confirm-code"),
    path("reset-password/<uuid:token>/", ResetPasswordView.as_view(), name="reset-password"),
    path("logout/", LogoutView.as_view(), name="logout"),
]
