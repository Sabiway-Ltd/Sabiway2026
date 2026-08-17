# sabiway/settings.py

"""Django settings for the shared SabiWay V2 backend."""

from datetime import timedelta
from pathlib import Path
import os

import cloudinary
import dj_database_url
import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))

DEBUG = env("DEBUG", default=False)
SECRET_KEY = env("SECRET_KEY")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

GOOGLE_CLIENT_ID = env("GOOGLE_CLIENT_ID", default="")
GOOGLE_CLIENT_SECRET = env("GOOGLE_CLIENT_SECRET", default="")
RESEND_API_KEY = env("RESEND_API_KEY", default="")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="SabiWay <no-reply@sabiway.com>")
ADMIN_REPORT_EMAIL = env("ADMIN_REPORT_EMAIL", default="admin@sabiway.com")

FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:3000")
BACKEND_URL = env("BACKEND_URL", default="http://localhost:8000")
EXPRESS_URL = env("EXPRESS_URL", default="http://localhost:5000")
PREBOOKING_CONTACT_BLOCK_ENABLED = env.bool("PREBOOKING_CONTACT_BLOCK_ENABLED", default=True)
VERIFICATION_GATE_ENABLED = env.bool("VERIFICATION_GATE_ENABLED", default=True)
VERIFICATION_DOCUMENT_KEY = env("VERIFICATION_DOCUMENT_KEY", default="")
VERIFICATION_REVIEW_SLA_HOURS = env.int("VERIFICATION_REVIEW_SLA_HOURS", default=48)
VERIFICATION_RETENTION_DAYS = env.int("VERIFICATION_RETENTION_DAYS", default=365)

SABIPAY_ENABLED = env.bool("SABIPAY_ENABLED", default=True)
SABIPAY_COMMISSION_RATE = env.float("SABIPAY_COMMISSION_RATE", default=0.10)
SABIPAY_FREEZE_DAYS = env.int("SABIPAY_FREEZE_DAYS", default=7)
PAYSTACK_SECRET_KEY = env("PAYSTACK_SECRET_KEY", default="")
PAYSTACK_PUBLIC_KEY = env("PAYSTACK_PUBLIC_KEY", default="")
PAYSTACK_BASE_URL = env("PAYSTACK_BASE_URL", default="https://api.paystack.co")
PAYSTACK_TIMEOUT_SECONDS = env.int("PAYSTACK_TIMEOUT_SECONDS", default=12)

GOOGLE_REDIRECT_URI = f"{BACKEND_URL}/api/auth/google-login/"

CORS_ALLOWED_ORIGINS = list(dict.fromkeys(env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[
        FRONTEND_URL,
        EXPRESS_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://sabiway2025.vercel.app",
    ],
)))
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "accounts",
    "docs",
    "profiles",
    "posts",
    "search",
    "notifications",
    "health",
    "marketplace",
    "verification.apps.VerificationConfig",
    "sabipay.apps.SabiPayConfig",
    "operations.apps.OperationsConfig",
    "rest_framework",
    "drf_yasg",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "cloudinary",
    "cloudinary_storage",
    "corsheaders",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "sabiway.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "sabiway.wsgi.application"

DATABASE_SSL_REQUIRE = env.bool("DATABASE_SSL_REQUIRE", default=False)
DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        ssl_require=DATABASE_SSL_REQUIRE,
    )
}
DATABASES["default"]["CONN_HEALTH_CHECKS"] = True

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

# Phase 10 transport/session hardening. Production can enable HTTPS-only settings
# explicitly without breaking local development or CI.
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=False)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=0)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", default=False)
SECURE_HSTS_PRELOAD = env.bool("SECURE_HSTS_PRELOAD", default=False)
X_FRAME_OPTIONS = "DENY"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=SECURE_SSL_REDIRECT)
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = env.int("SESSION_COOKIE_AGE", default=8 * 60 * 60)
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
CSRF_COOKIE_SECURE = env.bool("CSRF_COOKIE_SECURE", default=SECURE_SSL_REDIRECT)
CSRF_COOKIE_SAMESITE = "Lax"

# Bound request memory usage. Large supported files spill to temporary storage
# while the API continues to enforce feature-specific upload size/type limits.
DATA_UPLOAD_MAX_MEMORY_SIZE = env.int("DATA_UPLOAD_MAX_MEMORY_SIZE", default=15 * 1024 * 1024)
FILE_UPLOAD_MAX_MEMORY_SIZE = env.int("FILE_UPLOAD_MAX_MEMORY_SIZE", default=2 * 1024 * 1024)
DATA_UPLOAD_MAX_NUMBER_FIELDS = env.int("DATA_UPLOAD_MAX_NUMBER_FIELDS", default=1000)

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": env("API_ANON_RATE", default="120/min"),
        "user": env("API_USER_RATE", default="1200/min"),
        "login": env("API_LOGIN_RATE", default="10/min"),
        "signup": env("API_SIGNUP_RATE", default="10/hour"),
        "password_reset": env("API_PASSWORD_RESET_RATE", default="12/hour"),
        "oauth": env("API_OAUTH_RATE", default="30/hour"),
        "token_refresh": env("API_TOKEN_REFRESH_RATE", default="120/hour"),
    },
}

CLOUDINARY_STORAGE = {
    "CLOUD_NAME": env("CLOUDINARY_CLOUD_NAME", default=""),
    "API_KEY": env("CLOUDINARY_API_KEY", default=""),
    "API_SECRET": env("CLOUDINARY_API_SECRET", default=""),
}
DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"

cloudinary.config(
    cloud_name=CLOUDINARY_STORAGE["CLOUD_NAME"],
    api_key=CLOUDINARY_STORAGE["API_KEY"],
    api_secret=CLOUDINARY_STORAGE["API_SECRET"],
)

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env.int("JWT_ACCESS_MINUTES", default=30)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env.int("JWT_REFRESH_DAYS", default=30)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": False,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "VERIFYING_KEY": None,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "TOKEN_TYPE_CLAIM": "token_type",
    "JTI_CLAIM": "jti",
}
