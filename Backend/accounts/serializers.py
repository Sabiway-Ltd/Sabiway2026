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



class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name", "email", "is_active", "is_staff", "is_superuser"]
        read_only_fields = ["id", "email"]  # prevent changing email once set


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "full_name", "email", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)

        # Send Welcome Email
        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color:#f9fafb; padding:20px;">
            <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1); overflow:hidden;">
            
            <!-- Header -->
            <div style="background:#008753; padding:20px; text-align:center;">
                <img src="https://res.cloudinary.com/devqbjptr/image/upload/v1761435555/Group_3_2_1_buoqkz.png" alt="Sabiway Logo" style="height:50px;" />
                <h2 style="color:#ffffff; margin:10px 0 0;">Welcome to Sabiway 🎉</h2>
            </div>

            <!-- Body -->
            <div style="padding:30px; color:#333333; font-size:16px; line-height:1.5;">
                <p>Hi <b>{user.full_name}</b>,</p>
                <p>We’re excited to have you on board! 🎊</p>
                <p>Sabiway is your trusted platform to simplify your journey. Get started by logging into your account and exploring what we have prepared for you.</p>

                <div style="text-align:center; margin:20px;">
                <a href="{settings.FRONTEND_URL}/login" style="background:#2563eb; color:#ffffff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">
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

        return user



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
                <img src="https://res.cloudinary.com/devqbjptr/image/upload/v1761435555/Group_3_2_1_buoqkz.png" alt="Sabiway Logo" style="height:50px;" />
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