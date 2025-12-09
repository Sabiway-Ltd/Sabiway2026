# accounts/serializers.py

from rest_framework import serializers
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from .models import User, PasswordReset
from django.core.mail import send_mail
from .email_utils import send_resend_email
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.contrib.auth.hashers import make_password
from .models import PendingSignup


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name", "email", "is_active", "is_staff", "is_superuser"]
        read_only_fields = ["id", "email"]  # prevent changing email once set


class SignupSerializer(serializers.Serializer):
    full_name = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def create(self, validated_data):
        # Hash password
        password_hash = make_password(validated_data["password"])

        # Create pending signup
        pending = PendingSignup.objects.create(
            email=validated_data["email"],
            full_name=validated_data["full_name"],
            password_hash=password_hash
        )

        # Generate 6-digit confirmation code
        pending.generate_code()

        confirm_link = f"{settings.FRONTEND_URL}/confirm-signup/{pending.token}/"

        # Email body
        email_body = f"""
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f7; padding: 40px 0; text-align: center;">
        <div style="background-color: #ffffff; width: 90%; max-width: 520px; margin: auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          
          <div style="background-color: #008753; padding: 25px 0;">
            <img src="https://res.cloudinary.com/dk6ew5ikb/image/upload/v1764563759/Group_3_2_1_buoqkz_vkpakj.png" alt="SabiWay Logo" width="140" height="auto" style="display:block; margin:auto;">
          </div>

          <div style="padding: 30px;">
            <h2 style="color: #333333; margin-top: 10px;">Welcome, {pending.full_name} 👋</h2>
            <p style="font-size: 16px; color: #555555; line-height: 1.6;">
              Please confirm your email address to activate your account.
            </p>

            <a href="{confirm_link}" style="display: inline-block; margin-top: 20px; background-color: #008753; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Confirm My Email
            </a>

            <p style="margin-top: 25px; color: #777777; font-size: 14px;">Or use this code:</p>
            <div style="font-size: 26px; font-weight: bold; color: #008753; letter-spacing: 4px; margin-top: 8px;">
              {pending.code}
            </div>

            <p style="font-size: 13px; color: #999999; margin-top: 20px;">
              This confirmation link and code will expire in <strong>1 hour</strong>.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="font-size: 14px; color: #888888; line-height: 1.5;">
              Cheers,<br>
              <strong style="color: #008753;">The SabiWay Team</strong>
            </p>

            <p style="font-size: 12px; color: #bbbbbb; margin-top: 10px;">
              If you didn’t sign up for SabiWay, you can safely ignore this email.
            </p>
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

    def validate_token(self, value):
        try:
            idinfo = id_token.verify_oauth2_token(value, requests.Request(), settings.GOOGLE_CLIENT_ID)
        except Exception:
            raise serializers.ValidationError("Invalid Google token")

        if idinfo["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
            raise serializers.ValidationError("Wrong issuer")

        return idinfo



class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No account with this email")
        self.context["user"] = user
        return value

    def save(self):
        user = self.context["user"]
        reset_obj = PasswordReset.objects.create(user=user)
        reset_obj.generate_code()

        # reset_link = f"{settings.BACKEND_URL}/api/auth/reset-password/{reset_obj.reset_token}/"
        reset_link = f"{settings.FRONTEND_URL}/change-password/{reset_obj.reset_token}/"

        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color:#f9fafb; padding:20px;">
            <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1); overflow:hidden;">
            <!-- Header -->
            <div style="background:#008753; padding:20px; text-align:center;">
                <img src="https://res.cloudinary.com/dk6ew5ikb/image/upload/v1764563759/Group_3_2_1_buoqkz_vkpakj.png" alt="Sabiway Logo" style="height:50px;" />
                <h2 style="color:#ffffff; margin:10px 0 0;">Password Reset Request</h2>
            </div>

            <!-- Body -->
            <div style="padding:30px; color:#333333; font-size:16px; line-height:1.5;">
                <p>Hi <b>{user.full_name}</b>,</p>
                <p>You requested to reset your Sabiway account password. Use the code below to proceed:</p>

                <div style="text-align:center; margin:20px 0;">
                <span style="font-size:24px; font-weight:bold; background:#f3f4f6; padding:10px 20px; border-radius:6px; border:1px solid #e5e7eb;">
                    {reset_obj.code}
                </span>
                </div>

                <p>Alternatively, you can reset your password directly by clicking the button below:</p>

                <div style="text-align:center; margin:20px;">
                <a href="{reset_link}" style="background:#2563eb; color:#ffffff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">
                    Reset Password
                </a>
                </div>

                <p>This link will expire in 15 minutes. If you didn’t request this, please ignore this email.</p>
            </div>

            <!-- Footer -->
            <div style="background:#f3f4f6; padding:15px; text-align:center; font-size:14px; color:#6b7280;">
                © {timezone.now().year} Sabiway. All rights reserved.
            </div>
            </div>
        </body>
        </html>
        """

        send_resend_email(user.email, "Password Reset Request", email_body)
        return reset_obj


class ConfirmCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=4)

    def validate(self, data):
        try:
            user = User.objects.get(email=data["email"])
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
        except TokenError:
            raise serializers.ValidationError("Invalid or expired token")