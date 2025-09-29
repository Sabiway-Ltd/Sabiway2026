# accounts/views.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from django.conf import settings
import requests
from .serializers import ForgotPasswordSerializer, ConfirmCodeSerializer, ResetPasswordSerializer
from .models import PasswordReset, User
from .serializers import SignupSerializer, LoginSerializer, GoogleAuthSerializer
from .serializers import LogoutSerializer


class SignupView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = SignupSerializer


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(request, email=email, password=password)

        if not user:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "is_active": user.is_active,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            }
        })


class GoogleLoginView(APIView):
    """
    Handles both Google OAuth flows:
    1. POST with `id_token` (from frontend, verified by GoogleAuthSerializer).
    2. GET with `code` (Google redirects back with an authorization code).
    """

    def post(self, request):
        """Frontend sends id_token"""
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        idinfo = serializer.validated_data["token"]

        email = idinfo.get("email")
        full_name = idinfo.get("name")

        return self._handle_user(email, full_name)

    def get(self, request):
        """Google redirects with ?code=..."""
        code = request.query_params.get("code")
        if not code:
            return Response({"error": "Missing code"}, status=status.HTTP_400_BAD_REQUEST)

        # Exchange code for tokens
        token_url = "https://oauth2.googleapis.com/token"

        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": f"{settings.BACKEND_URL}/api/auth/google-login/",  # ✅ match Google Console
            "grant_type": "authorization_code",
        }
        r = requests.post(token_url, data=data)
        tokens = r.json()

        if "error" in tokens:
            return Response(tokens, status=status.HTTP_400_BAD_REQUEST)

        # Get user info
        userinfo = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        ).json()

        email = userinfo.get("email")
        full_name = userinfo.get("name")

        return self._handle_user(email, full_name)

    def _handle_user(self, email, full_name):
        """Shared logic: create or get user, return JWT"""
        user, created = User.objects.get_or_create(
            email=email,
            defaults={"full_name": full_name}
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "is_active": user.is_active,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            },
            "is_new_user": created
        }, status=status.HTTP_200_OK)


class ForgotPasswordView(generics.GenericAPIView):
    serializer_class = ForgotPasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reset_obj = serializer.save()
        return Response({"message": "Password reset instructions sent to email"})


class ConfirmCodeView(generics.GenericAPIView):
    serializer_class = ConfirmCodeSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reset_obj = serializer.context["reset_obj"]
        return Response({"message": "Code confirmed. You can now reset password.", "reset_token": str(reset_obj.reset_token)})


class ResetPasswordView(generics.GenericAPIView):
    serializer_class = ResetPasswordSerializer

    def post(self, request, token):
        try:
            reset_obj = PasswordReset.objects.get(reset_token=token, is_used=False)
        except PasswordReset.DoesNotExist:
            return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(reset_obj)
        return Response({"message": "Password has been reset successfully"})
    
class LogoutView(generics.GenericAPIView):
    serializer_class = LogoutSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Logout successful"}, status=status.HTTP_200_OK)