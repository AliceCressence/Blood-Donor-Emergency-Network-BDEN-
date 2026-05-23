import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR.parent.parent / ".env")

SECRET_KEY = os.environ.get("CAMPAIGN_SECRET_KEY", "unsafe-campaign-dev-key")
DEBUG = os.environ.get("DEBUG", "False") == "True"
ALLOWED_HOSTS = [host.strip() for host in os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if host.strip()]
INSTALLED_APPS = ["django_prometheus", "django.contrib.contenttypes", "django.contrib.auth", "rest_framework", "corsheaders"]
MIDDLEWARE = ["django_prometheus.middleware.PrometheusBeforeMiddleware", "django.middleware.security.SecurityMiddleware", "corsheaders.middleware.CorsMiddleware", "django.middleware.common.CommonMiddleware", "django_prometheus.middleware.PrometheusAfterMiddleware"]
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
DATABASES = {"default": {"ENGINE": "django.db.backends.postgresql", "NAME": os.environ.get("CAMPAIGN_DB_NAME", "bden_campaign"), "USER": os.environ.get("CAMPAIGN_DB_USER", "bden_user"), "PASSWORD": os.environ.get("CAMPAIGN_DB_PASSWORD", "bden_password"), "HOST": os.environ.get("campaign_DB_HOST", os.environ.get("CAMPAIGN_DB_HOST", "campaign-db")), "PORT": os.environ.get("CAMPAIGN_DB_PORT", "5432")}}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
TIME_ZONE = "Africa/Douala"
USE_TZ = True
