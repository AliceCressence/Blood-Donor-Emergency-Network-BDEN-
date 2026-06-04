# config/settings/dev.py
from .base import *
import sys

DEBUG = True
ALLOWED_HOSTS = ["*"]

if "pytest" in sys.modules or "test" in sys.argv:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }
else:
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
