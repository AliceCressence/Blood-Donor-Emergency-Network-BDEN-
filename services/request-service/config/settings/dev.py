from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*"]

DATABASES = {
    "default": {
        "ENGINE":   "django.db.backends.postgresql",
        "NAME":     os.environ.get("REQUEST_DB_NAME", "bden_request"),
        "USER":     os.environ.get("REQUEST_DB_USER", "bden_user"),
        "PASSWORD": os.environ.get("REQUEST_DB_PASSWORD", "bden_password"),
        "HOST":     os.environ.get("REQUEST_DB_HOST", "request-db"),
        "PORT":     os.environ.get("REQUEST_DB_PORT", "5432"),
    }
}
