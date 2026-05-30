# notifications/admin.py
from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(ModelAdmin):
    list_display  = ["title", "type", "user_id", "read", "created_at"]
    list_filter   = ["type", "read"]
    search_fields = ["title", "body"]
    readonly_fields = ["id", "created_at"]