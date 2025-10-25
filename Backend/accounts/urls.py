from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    SignupView, LoginView, GoogleLoginView, ForgotPasswordView, 
    ConfirmCodeView, ResetPasswordView, LogoutView, 
    GenerateGoogleAuthURLView, UserViewSet, VerifyResetTokenView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename="user")

urlpatterns = [
    path("signup/", SignupView.as_view(), name="signup"),
    path("login/", LoginView.as_view(), name="login"),
    path("google-login/", GoogleLoginView.as_view(), name="google-login"),
    path("google/callback/", GoogleLoginView.as_view(), name="google-callback"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("confirm-code/", ConfirmCodeView.as_view(), name="confirm-code"),
    path("reset-password/<uuid:token>/", ResetPasswordView.as_view(), name="reset-password"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("generate-google-url/", GenerateGoogleAuthURLView.as_view(), name="generate-google-url"),
    path("auth/verify-reset-token/<uuid:token>/", VerifyResetTokenView.as_view(), name="verify-reset-token"),


    # ✅ JWT Token refresh route
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("", include(router.urls)),  # ✅ include user endpoints
]
