from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*"]

DATABASES = {
    "default": {
        "ENGINE":   "django.db.backends.postgresql",
        "NAME":     "bden_request",
        "USER":     "bden_user",
        "PASSWORD": "bden_password",
        "HOST":     "127.0.0.1",
        "PORT":     "5434",
    }
}