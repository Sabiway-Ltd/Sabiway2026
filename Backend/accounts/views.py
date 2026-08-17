from urllib.parse import urlencode

import requests
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import redirect
from django.utils import timezone
from django.utils.crypto import get_random_string
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .email_utils import send_resend_email
from .models import PasswordReset, PendingSignup, User
from .serializers import ConfirmCodeSerializer, ForgotPasswordSerializer, GoogleAuthSerializer, LoginSerializer, LogoutSerializer, ResetPasswordSerializer, SignupSerializer, UserSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("id")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


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
        now = timezone.now()
        user = User.objects.create_user(email=pending.email, full_name=pending.full_name, role=pending.role, phone_number=pending.phone_number, terms_accepted_at=pending.terms_accepted_at, onboarding_completed_at=now, password=None)
        user.password = pending.password_hash
        user.save(update_fields=["password"])
        pending.is_used = True
        pending.save(update_fields=["is_used"])
        email_body = f'<html><body><p>Hi <b>{user.full_name}</b>,</p><p>Your SabiWay account is now active.</p><p>© {now.year} SabiWay</p></body></html>'
        send_resend_email(user.email, "Welcome to SabiWay", email_body)
        return Response({"message": "Signup confirmed. You can now login."}, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        password = serializer.validated_data["password"]
        user = User.objects.filter(email=email).first()
        if user and not user.is_active:
            return Response({"error": "This account is suspended."}, status=status.HTTP_403_FORBIDDEN)
        if not user or not user.check_password(password):
            return Response({"error": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        return Response(self._session_payload(user, refresh))

    @staticmethod
    def _session_payload(user, refresh):
        return {"refresh": str(refresh), "access": str(refresh.access_token), "user": {"id": user.id, "full_name": user.full_name, "email": user.email, "role": user.role, "phone_number": user.phone_number, "onboarding_complete": bool(user.onboarding_completed_at), "is_active": user.is_active, "is_staff": user.is_staff, "is_superuser": user.is_superuser}}


class GoogleLoginView(APIView):
    """Google login without allowing first-time users to bypass role/terms onboarding."""

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        idinfo = serializer.validated_data["token"]
        return self._handle_user(idinfo.get("email"), idinfo.get("name"), role=serializer.validated_data.get("role"), phone_number=serializer.validated_data.get("phone_number", ""), terms_accepted=serializer.validated_data.get("terms_accepted", False), from_redirect=False)

    def get(self, request):
        code = request.query_params.get("code")
        if not code:
            return Response({"error": "Missing code"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token_response = requests.post("https://oauth2.googleapis.com/token", data={"code": code, "client_id": settings.GOOGLE_CLIENT_ID, "client_secret": settings.GOOGLE_CLIENT_SECRET, "redirect_uri": settings.GOOGLE_REDIRECT_URI, "grant_type": "authorization_code"}, timeout=15)
            token_response.raise_for_status()
            tokens = token_response.json()
            if "access_token" not in tokens:
                raise ValueError("Missing access token")
            userinfo_response = requests.get("https://www.googleapis.com/oauth2/v2/userinfo", headers={"Authorization": f"Bearer {tokens['access_token']}"}, timeout=15)
            userinfo_response.raise_for_status()
            userinfo = userinfo_response.json()
        except (requests.RequestException, ValueError):
            return Response({"error": "Google authentication failed."}, status=status.HTTP_400_BAD_REQUEST)
        return self._handle_user(userinfo.get("email"), userinfo.get("name"), from_redirect=True)

    def _handle_user(self, email, full_name, role=None, phone_number="", terms_accepted=False, from_redirect=False):
        if not email:
            return Response({"error": "Google did not provide an email address."}, status=status.HTTP_400_BAD_REQUEST)
        email = email.strip().lower()
        user = User.objects.filter(email=email).first()
        created = False
        if user and not user.is_active:
            if from_redirect:
                return redirect(f"{settings.FRONTEND_URL}/callback?account_suspended=1")
            return Response({"error": "This account is suspended."}, status=status.HTTP_403_FORBIDDEN)
        if not user:
            if from_redirect:
                return redirect(f"{settings.FRONTEND_URL}/callback?onboarding_required=1")
            if role not in {User.Role.CLIENT, User.Role.PROFESSIONAL} or terms_accepted is not True:
                return Response({"error": "Role selection and terms acceptance are required for a new Google account.", "onboarding_required": True}, status=status.HTTP_409_CONFLICT)
            now = timezone.now()
            user = User.objects.create_user(email=email, full_name=(full_name or email.split("@")[0]).strip(), role=role, phone_number=phone_number, terms_accepted_at=now, onboarding_completed_at=now, password=get_random_string(32))
            created = True
        if not user.onboarding_completed_at:
            if from_redirect:
                return redirect(f"{settings.FRONTEND_URL}/callback?onboarding_required=1")
            return Response({"error": "Complete onboarding before signing in.", "onboarding_required": True}, status=status.HTTP_409_CONFLICT)
        refresh = RefreshToken.for_user(user)
        if from_redirect:
            fragment = urlencode({"access": str(refresh.access_token), "refresh": str(refresh)})
            return redirect(f"{settings.FRONTEND_URL}/callback#{fragment}")
        payload = LoginView._session_payload(user, refresh)
        payload["is_new_user"] = created
        return Response(payload, status=status.HTTP_200_OK)


class GenerateGoogleAuthURLView(APIView):
    def get(self, request):
        params = {"client_id": settings.GOOGLE_CLIENT_ID, "redirect_uri": settings.GOOGLE_REDIRECT_URI, "response_type": "code", "scope": "openid email profile", "access_type": "offline", "prompt": "consent"}
        return JsonResponse({"auth_url": f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"})


class ForgotPasswordView(generics.GenericAPIView):
    serializer_class = ForgotPasswordSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "If an account exists for this email, password reset instructions have been sent."})


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
        if not reset_obj.is_valid():
            return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data=request.data, context={"user": reset_obj.user})
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
        if not reset_obj.is_valid():
            return Response({"error": "Token expired or invalid."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"message": "Valid token."}, status=status.HTTP_200_OK)
