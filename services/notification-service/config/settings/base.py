# config/settings/base.py
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR.parent.parent / ".env")
load_dotenv(BASE_DIR / ".env")

SECRET_KEY    = os.environ.get("NOTIFICATION_SECRET_KEY", "unsafe-notification-dev-key")
DEBUG         = os.environ.get("DEBUG", "False") == "True"
ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]

INSTALLED_APPS = [
    "django_prometheus",
    "unfold",
    "django.contrib.admin",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "rest_framework",
    "corsheaders",
    "notifications",
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

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS":    [],
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

ROOT_URLCONF     = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE":   "django.db.backends.postgresql",
        "NAME":     os.environ.get("NOTIFICATION_DB_NAME",     "bden_notification"),
        "USER":     os.environ.get("NOTIFICATION_DB_USER",     "bden_user"),
        "PASSWORD": os.environ.get("NOTIFICATION_DB_PASSWORD", "bden_password"),
        "HOST":     os.environ.get("NOTIFICATION_DB_HOST",     "localhost"),
        "PORT":     os.environ.get("NOTIFICATION_DB_PORT",     "5435"),
    }
}

REDIS_URL          = os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/0")
CELERY_BROKER_URL  = REDIS_URL

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
}

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("FRONTEND_URL", "http://localhost:5173").split(",")
    if origin.strip()
]

INTERNAL_API_KEY   = os.environ.get("INTERNAL_API_KEY", "dev-internal-api-key")
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
LANGUAGE_CODE      = "en-us"
TIME_ZONE          = "Africa/Douala"
USE_I18N           = True
USE_TZ             = True
STATIC_URL         = "/static/"
STATIC_ROOT        = BASE_DIR / "staticfiles"
STATICFILES_DIRS   = [BASE_DIR / "static"]

UNFOLD = {
    "SITE_TITLE":  "BDEN Notification Service Admin",
    "SITE_HEADER": "Blood Donor Emergency Network",
    "SITE_SYMBOL": "favorite",
}