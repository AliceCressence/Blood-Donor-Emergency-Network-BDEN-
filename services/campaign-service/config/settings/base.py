import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR.parent.parent / ".env")
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get("CAMPAIGN_SECRET_KEY", "unsafe-campaign-dev-key")
DEBUG = os.environ.get("DEBUG", "False") == "True"
ALLOWED_HOSTS = [host.strip() for host in os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1,campaign-service").split(",") if host.strip()]

INSTALLED_APPS = [
    "django_prometheus",
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
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
    "campaigns",
    "myths",
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
    "django_prometheus.middleware.PrometheusAfterMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

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

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("CAMPAIGN_DB_NAME", "bden_campaign"),
        "USER": os.environ.get("CAMPAIGN_DB_USER", "bden_user"),
        "PASSWORD": os.environ.get("CAMPAIGN_DB_PASSWORD", "bden_password"),
        "HOST": os.environ.get("CAMPAIGN_DB_HOST", "campaign-db"),
        "PORT": os.environ.get("CAMPAIGN_DB_PORT", "5432"),
    }
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["campaigns.authentication.ServiceJWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "EXCEPTION_HANDLER": "campaigns.utils.custom_exception_handler",
}

SIMPLE_JWT = {
    "ALGORITHM": os.environ.get("JWT_ALGORITHM", "HS256"),
    "SIGNING_KEY": os.environ.get("AUTH_SECRET_KEY", "change-me-auth"),
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_CLAIM": "user_id",
}

CORS_ALLOWED_ORIGINS = [origin.strip() for origin in os.environ.get("FRONTEND_URL", "http://localhost:5173").split(",") if origin.strip()]

SWAGGER_SETTINGS = {
    "SECURITY_DEFINITIONS": {"Bearer": {"type": "apiKey", "name": "Authorization", "in": "header"}},
    "USE_SESSION_AUTH": False,
    "DOC_EXPANSION": "none",
    "DEFAULT_MODEL_RENDERING": "example",
}

REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")
DONOR_SERVICE_INTERNAL_URL = os.environ.get("DONOR_SERVICE_INTERNAL_URL", os.environ.get("DONOR_SERVICE_URL", "http://donor-service:8002"))
INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY", "dev-internal-api-key")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Douala"
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

UNFOLD = {
    "SITE_TITLE": "BDEN Campaign Service Admin",
    "SITE_HEADER": "Blood Donor Emergency Network",
    "SITE_SYMBOL": "campaign",
    "SITE_FAVICONS": [{"rel": "icon", "href": "/static/favicon.svg", "type": "image/svg+xml"}],
}
