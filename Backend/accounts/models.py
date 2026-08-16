# accounts/models.py

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
import uuid
import random
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

class UserManager(BaseUserManager):
    def create_user(self, email, full_name=None, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, full_name, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        CLIENT = "client", "Client"
        PROFESSIONAL = "professional", "Professional"

    full_name = models.CharField(max_length=255, blank=False, null=False)  # new field
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CLIENT)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]  # full_name required when creating superuser

    def __str__(self):
        return self.full_name if self.full_name else self.email


class PasswordReset(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    code = models.CharField(max_length=4, blank=True, null=True)
    reset_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def generate_code(self):
        self.code = str(random.randint(1000, 9999))  # 4-digit code
        self.save()

    def is_valid(self):
        return not self.is_used and self.created_at >= timezone.now() - timedelta(minutes=15)



class PendingSignup(models.Model):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=User.Role.choices, default=User.Role.CLIENT)
    password_hash = models.CharField(max_length=128)
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    code = models.CharField(max_length=6, blank=True)  # 6-digit code
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def generate_code(self):
        self.code = str(random.randint(100000, 999999))
        self.save()

    def is_valid(self):
        # Link valid for 1 hour
        return not self.is_used and self.created_at >= timezone.now() - timedelta(hours=1)