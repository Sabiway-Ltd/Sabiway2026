from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from google.auth.transport import requests
from google.oauth2 import id_token
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from .email_utils import send_resend_email
from .identity import normalise_phone_number
from .models import PasswordReset, PendingSignup, User


class UserSerializer(serializers.ModelSerializer):
    onboarding_complete = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "full_name", "email", "role", "phone_number",
            "terms_accepted_at", "onboarding_completed_at", "onboarding_complete",
            "is_active", "is_staff", "is_superuser",
        ]
        read_only_fields = [
            "id", "email", "terms_accepted_at", "onboarding_completed_at",
            "onboarding_complete",
        ]

    def get_onboarding_complete(self, obj):
        return bool(obj.onboarding_completed_at)


class SignupSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.Role.choices)
    phone_number = serializers.CharField(required=False, allow_blank=True, max_length=32)
    terms_accepted = serializers.BooleanField(write_only=True)

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email=normalized).exists() or PendingSignup.objects.filter(email=normalized).exists():
            raise serializers.ValidationError("An account or pending signup already exists for this email.")
        return normalized

    def validate_phone_number(self, value):
        return normalise_phone_number(value)

    def validate_terms_accepted(self, value):
        if value is not True:
            raise serializers.ValidationError("You must accept the SabiWay terms to create an account.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        accepted_at = timezone.now()
        pending = PendingSignup.objects.create(
            email=validated_data["email"],
            full_name=validated_data["full_name"].strip(),
            role=validated_data["role"],
            phone_number=validated_data.get("phone_number", ""),
            terms_accepted_at=accepted_at,
            password_hash=make_password(validated_data["password"]),
        )
        pending.generate_code()

        confirm_link = f"{settings.FRONTEND_URL}/confirm-signup/{pending.token}/"
        email_body = f"""
        <div style="font-family:Arial,sans-serif;background:#f4f4f7;padding:40px 0;text-align:center">
          <div style="background:#fff;width:90%;max-width:520px;margin:auto;border-radius:10px;overflow:hidden">
            <div style="background:#008753;padding:25px 0">
              <img src="https://res.cloudinary.com/dk6ew5ikb/image/upload/v1764563759/Group_3_2_1_buoqkz_vkpakj.png" alt="SabiWay Logo" width="140">
            </div>
            <div style="padding:30px">
              <h2 style="color:#333">Welcome, {pending.full_name}</h2>
              <p>Please confirm your email address to activate your account.</p>
              <a href="{confirm_link}" style="display:inline-block;margin-top:20px;background:#008753;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:bold">Confirm My Email</a>
              <p style="margin-top:25px;color:#777">Or use this code:</p>
              <div style="font-size:26px;font-weight:bold;color:#008753;letter-spacing:4px">{pending.code}</div>
              <p style="font-size:13px;color:#999">This confirmation link and code will expire in 1 hour.</p>
            </div>
          </div>
        </div>
        """
        send_resend_email(pending.email, "Confirm your signup", email_body)
        return pending


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class GoogleAuthSerializer(serializers.Serializer):
    token = serializers.CharField()
    role = serializers.ChoiceField(choices=User.Role.choices, required=False)
    phone_number = serializers.CharField(required=False, allow_blank=True, max_length=32)
    terms_accepted = serializers.BooleanField(required=False, write_only=True)

    def validate_token(self, value):
        try:
            idinfo = id_token.verify_oauth2_token(value, requests.Request(), settings.GOOGLE_CLIENT_ID)
        except Exception as exc:
            raise serializers.ValidationError("Invalid Google token") from exc
        if idinfo["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
            raise serializers.ValidationError("Wrong issuer")
        return idinfo

    def validate_phone_number(self, value):
        return normalise_phone_number(value)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        normalized = value.strip().lower()
        self.context["user"] = User.objects.filter(email=normalized).first()
        return normalized

    def save(self):
        user = self.context["user"]
        if user is None:
            return None
        reset_obj = PasswordReset.objects.create(user=user)
        reset_obj.generate_code()
        reset_link = f"{settings.FRONTEND_URL}/change-password/{reset_obj.reset_token}/"
        email_body = f"""
        <html><body style="font-family:Arial,sans-serif;background:#f9fafb;padding:20px">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
          <div style="background:#008753;padding:20px;text-align:center"><h2 style="color:#fff">Password Reset Request</h2></div>
          <div style="padding:30px;color:#333">
            <p>Hi <b>{user.full_name}</b>,</p>
            <p>Use this code to reset your password:</p>
            <div style="text-align:center;font-size:24px;font-weight:bold">{reset_obj.code}</div>
            <p><a href="{reset_link}">Reset Password</a></p>
            <p>This link will expire in 15 minutes.</p>
          </div>
          <div style="background:#f3f4f6;padding:15px;text-align:center">© {timezone.now().year} SabiWay</div>
        </div></body></html>
        """
        send_resend_email(user.email, "Password Reset Request", email_body)
        return reset_obj


class ConfirmCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=4)

    def validate(self, data):
        try:
            user = User.objects.get(email=data["email"].strip().lower())
            reset_obj = PasswordReset.objects.filter(user=user, code=data["code"], is_used=False).latest("created_at")
        except (User.DoesNotExist, PasswordReset.DoesNotExist):
            raise serializers.ValidationError("Invalid code")
        if not reset_obj.is_valid():
            raise serializers.ValidationError("Code expired or already used")
        self.context["reset_obj"] = reset_obj
        return data


class ResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match")
        validate_password(data["new_password"], user=self.context.get("user"))
        return data

    def save(self, reset_obj):
        user = reset_obj.user
        user.set_password(self.validated_data["new_password"])
        user.save()
        reset_obj.is_used = True
        reset_obj.save()
        return user


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        self.token = attrs["refresh"]
        return attrs

    def save(self, **kwargs):
        try:
            RefreshToken(self.token).blacklist()
        except TokenError as exc:
            raise serializers.ValidationError("Invalid or expired token") from exc
