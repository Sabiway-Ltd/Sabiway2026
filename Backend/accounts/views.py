# accounts/views.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from django.conf import settings
import requests
from .serializers import ForgotPasswordSerializer, ConfirmCodeSerializer, ResetPasswordSerializer
from .models import PasswordReset, User, PendingSignup
from .serializers import SignupSerializer, LoginSerializer, GoogleAuthSerializer
from .serializers import LogoutSerializer
from urllib.parse import urlencode
from django.http import JsonResponse
from django.utils.crypto import get_random_string
from rest_framework import viewsets, permissions
from .serializers import UserSerializer
from django.contrib.auth.models import BaseUserManager
from .email_utils import send_resend_email
from django.utils import timezone



class UserViewSet(viewsets.ModelViewSet):
    """
    Admin-only endpoint to manage users
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]  # Only admins can manage users


class SignupView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = SignupSerializer


class ConfirmSignupView(APIView):
    def get(self, request, token):
        try:
            pending = PendingSignup.objects.get(token=token, is_used=False)
        except PendingSignup.DoesNotExist:
            return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)

        if not pending.is_valid():
            return Response({"error": "Token expired"}, status=status.HTTP_400_BAD_REQUEST)

        # Create the real User
        user = User.objects.create_user(
            email=pending.email,
            full_name=pending.full_name,
            password=None  # we'll assign the hashed password
        )
        user.password = pending.password_hash
        user.save()

        pending.is_used = True
        pending.save()

        # Send welcome email
        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color:#f9fafb; padding:20px;">
            <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1); overflow:hidden;">
            
            <!-- Header -->
            <div style="background:#008753; padding:20px; text-align:center;">
                <img src="https://res.cloudinary.com/dk6ew5ikb/image/upload/v1764563759/Group_3_2_1_buoqkz_vkpakj.png" alt="Sabiway Logo" style="height:50px;" />
                <h2 style="color:#ffffff; margin:10px 0 0;">Welcome to Sabiway 🎉</h2>
            </div>

            <!-- Body -->
            <div style="padding:30px; color:#333333; font-size:16px; line-height:1.5;">
                <p>Hi <b>{user.full_name}</b>,</p>
                <p>We’re excited to have you on board! 🎊</p>
                <p>Sabiway is your trusted platform to simplify your journey. Get started by logging into your account and exploring what we have prepared for you.</p>

                <div style="text-align:center; margin:20px;">
                <a href="{settings.FRONTEND_URL}/community" style="background:#2563eb; color:#ffffff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">
                    Go to Dashboard
                </a>
                </div>

                <p>If you have any questions, feel free to reach out to our support team anytime.</p>
            </div>

            <!-- Footer -->
            <div style="background:#f3f4f6; padding:15px; text-align:center; font-size:14px; color:#6b7280;">
                © {timezone.now().year} Sabiway. All rights reserved.
            </div>
            </div>
        </body>
        </html>
        """
        send_resend_email(user.email, "Welcome to Sabiway 🎉", email_body)

        return Response({"message": "Signup confirmed. You can now login."}, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(request, email=email, password=password)

        if not user:
            return Response({"error": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)

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
        """Frontend sends id_token directly"""
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        idinfo = serializer.validated_data["token"]

        email = idinfo.get("email")
        full_name = idinfo.get("name")

        return self._handle_user(email, full_name, from_redirect=False)

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
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
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

        # ✅ Handle user creation/login and redirect to frontend
        return self._handle_user(email, full_name, from_redirect=True)

    def _handle_user(self, email, full_name, from_redirect=False):
        user = User.objects.filter(email=email).first()
        created = False

        if not user:
            signup_serializer = SignupSerializer(data={
                "email": email,
                "full_name": full_name,
                "password": get_random_string(12)
            })
            signup_serializer.is_valid(raise_exception=True)
            user = signup_serializer.save()
            created = True

        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        refresh_token = str(refresh)

        if from_redirect:
            # ✅ Redirect user to frontend callback with tokens
            redirect_url = (
                f"{settings.FRONTEND_URL}/callback"
                f"?access={access}&refresh={refresh_token}"
            )
            from django.shortcuts import redirect
            return redirect(redirect_url)

        # ✅ For API calls (POST) — return tokens as JSON
        return Response({
            "refresh": refresh_token,
            "access": access,
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






class GenerateGoogleAuthURLView(APIView):
    """
    Returns the Google OAuth2 login URL
    """

    def get(self, request):
        base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,  # ✅ frontend URL
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
        }
        url = f"{base_url}?{urlencode(params)}"
        return JsonResponse({"auth_url": url})

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
    


class VerifyResetTokenView(APIView):
    def get(self, request, token):
        try:
            reset_obj = PasswordReset.objects.get(reset_token=token, is_used=False)
        except PasswordReset.DoesNotExist:
            return Response({"error": "Invalid token."}, status=status.HTTP_404_NOT_FOUND)

        # Check expiration (assuming you already have is_valid() in your model)
        if not reset_obj.is_valid():
            return Response({"error": "Token expired or invalid."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "Valid token."}, status=status.HTTP_200_OK)

