import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR.parent.parent / ".env")

SECRET_KEY = os.environ.get("REQUEST_SECRET_KEY", "unsafe-request-dev-key")
DEBUG = os.environ.get("DEBUG", "False") == "True"
ALLOWED_HOSTS = [host.strip() for host in os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if host.strip()]
INSTALLED_APPS = ["django_prometheus", "django.contrib.contenttypes", "django.contrib.auth", "rest_framework", "corsheaders"]
MIDDLEWARE = ["django_prometheus.middleware.PrometheusBeforeMiddleware", "django.middleware.security.SecurityMiddleware", "corsheaders.middleware.CorsMiddleware", "django.middleware.common.CommonMiddleware", "django_prometheus.middleware.PrometheusAfterMiddleware"]
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
DATABASES = {"default": {"ENGINE": "django.db.backends.postgresql", "NAME": os.environ.get("REQUEST_DB_NAME", "bden_request"), "USER": os.environ.get("REQUEST_DB_USER", "bden_user"), "PASSWORD": os.environ.get("REQUEST_DB_PASSWORD", "bden_password"), "HOST": os.environ.get("REQUEST_DB_HOST", "request-db"), "PORT": os.environ.get("REQUEST_DB_PORT", "5432")}}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
TIME_ZONE = "Africa/Douala"
USE_TZ = True
