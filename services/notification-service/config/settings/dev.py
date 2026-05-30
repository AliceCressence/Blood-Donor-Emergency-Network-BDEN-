# config/settings/dev.py
from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*"]

DATABASES = {
    "default": {
        "ENGINE":   "django.db.backends.postgresql",
        "NAME":     os.environ.get("NOTIFICATION_DB_NAME", "bden_notification"),
        "USER":     os.environ.get("NOTIFICATION_DB_USER", "bden_user"),
        "PASSWORD": os.environ.get("NOTIFICATION_DB_PASSWORD", "bden_password"),
        "HOST":     os.environ.get("NOTIFICATION_DB_HOST", "notification-db"),
        "PORT":     os.environ.get("NOTIFICATION_DB_PORT", "5432"),
    }
}
