import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR.parent.parent / ".env")

SECRET_KEY = os.environ.get("NOTIFICATION_SECRET_KEY", "unsafe-notification-dev-key")
DEBUG = os.environ.get("DEBUG", "False") == "True"
ALLOWED_HOSTS = [host.strip() for host in os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if host.strip()]
INSTALLED_APPS = ["django_prometheus", "unfold", "django.contrib.admin", "django.contrib.sessions", "django.contrib.messages", "django.contrib.staticfiles", "django.contrib.contenttypes", "django.contrib.auth", "rest_framework", "corsheaders"]
MIDDLEWARE = ["django_prometheus.middleware.PrometheusBeforeMiddleware", "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware", "django.contrib.sessions.middleware.SessionMiddleware", "corsheaders.middleware.CorsMiddleware", "django.middleware.common.CommonMiddleware", "django.contrib.auth.middleware.AuthenticationMiddleware", "django.contrib.messages.middleware.MessageMiddleware", "django_prometheus.middleware.PrometheusAfterMiddleware"]
TEMPLATES = [{"BACKEND": "django.template.backends.django.DjangoTemplates", "DIRS": [], "APP_DIRS": True, "OPTIONS": {"context_processors": ["django.template.context_processors.debug", "django.template.context_processors.request", "django.contrib.auth.context_processors.auth", "django.contrib.messages.context_processors.messages"]}}]
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
DATABASES = {"default": {"ENGINE": "django.db.backends.postgresql", "NAME": os.environ.get("NOTIFICATION_DB_NAME", "bden_notification"), "USER": os.environ.get("NOTIFICATION_DB_USER", "bden_user"), "PASSWORD": os.environ.get("NOTIFICATION_DB_PASSWORD", "bden_password"), "HOST": os.environ.get("NOTIFICATION_DB_HOST", "notification-db"), "PORT": os.environ.get("NOTIFICATION_DB_PORT", "5432")}}
REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")
CELERY_BROKER_URL = REDIS_URL
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
TIME_ZONE = "Africa/Douala"
USE_TZ = True
STATIC_URL = "/static/"

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
