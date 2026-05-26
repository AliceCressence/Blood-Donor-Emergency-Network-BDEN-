import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
REPO_ROOT = BASE_DIR.parent.parent

load_dotenv(REPO_ROOT / ".env")
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get("DONOR_SECRET_KEY", "unsafe-donor-dev-key")
DEBUG = os.environ.get("DEBUG", "False") == "True"
ALLOWED_HOSTS = [host.strip() for host in os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if host.strip()]

INSTALLED_APPS = [
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    "django_prometheus",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "drf_yasg",
    "donors",
    "estimation",
]

MIDDLEWARE = [
    "django_prometheus.middleware.PrometheusBeforeMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django_prometheus.middleware.PrometheusAfterMiddleware",
]

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
    }
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DONOR_DB_NAME", "bden_donor"),
        "USER": os.environ.get("DONOR_DB_USER", "bden_user"),
        "PASSWORD": os.environ.get("DONOR_DB_PASSWORD", "bden_password"),
        "HOST": os.environ.get("DONOR_DB_HOST", "donor-db"),
        "PORT": os.environ.get("DONOR_DB_PORT", "5432"),
    }
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "donors.authentication.ServiceJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.environ.get("ACCESS_TOKEN_LIFETIME_MINUTES", 60))),
    "ALGORITHM": "HS256",
    "SIGNING_KEY": os.environ.get("AUTH_SECRET_KEY", "change-me-auth"),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_CLAIM": "user_id",
}

SWAGGER_SETTINGS = {
    "SECURITY_DEFINITIONS": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT authorization header using the Bearer scheme. Example: Bearer <token>",
        }
    },
    "USE_SESSION_AUTH": False,
    "DOC_EXPANSION": "none",
    "DEFAULT_MODEL_RENDERING": "example",
}

UNFOLD = {
    "SITE_TITLE": "BDEN Donor Service Admin",
    "SITE_HEADER": "Blood Donor Emergency Network",
    "SITE_SYMBOL": "favorite",
}

CORS_ALLOWED_ORIGINS = [origin.strip() for origin in os.environ.get("FRONTEND_URL", "http://localhost:5173").split(",") if origin.strip()]
CORS_ALLOW_CREDENTIALS = True

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL_NAME = os.environ.get("GEMINI_MODEL_NAME", "gemini-1.5-flash")
REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")
REDIS_CACHE_URL = os.environ.get("REDIS_CACHE_URL", "redis://redis:6379/1")
AUTH_SERVICE_INTERNAL_URL = os.environ.get("AUTH_SERVICE_INTERNAL_URL", "http://auth-service:8001")
REQUEST_SERVICE_INTERNAL_URL = os.environ.get("REQUEST_SERVICE_INTERNAL_URL", "http://request-service:8003")
INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY", "dev-internal-api-key")
DEFAULT_MATCHING_RADIUS_KM = int(os.environ.get("DEFAULT_MATCHING_RADIUS_KM", 30))
MAX_MATCHING_RADIUS_KM = int(os.environ.get("MAX_MATCHING_RADIUS_KM", 100))

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Douala"
USE_I18N = True
USE_TZ = True
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
