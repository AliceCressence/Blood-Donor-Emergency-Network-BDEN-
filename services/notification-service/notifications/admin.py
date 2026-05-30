# notifications/admin.py
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import GroupAdmin as DjangoGroupAdmin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.models import Group
from unfold.admin import ModelAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm
from .models import Notification, NotificationPreference


class UnfoldUserAdmin(DjangoUserAdmin, ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm


class UnfoldGroupAdmin(DjangoGroupAdmin, ModelAdmin):
    pass


for model in (get_user_model(), Group):
    try:
        admin.site.unregister(model)
    except admin.sites.NotRegistered:
        pass

admin.site.register(get_user_model(), UnfoldUserAdmin)
admin.site.register(Group, UnfoldGroupAdmin)


@admin.register(Notification)
class NotificationAdmin(ModelAdmin):
    list_display  = ["title", "type", "user_id", "read", "email_status", "created_at"]
    list_filter   = ["type", "read", "email_status"]
    search_fields = ["title", "body"]
    readonly_fields = ["id", "sent_at", "read_at", "created_at"]


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(ModelAdmin):
    list_display = ["user_id", "emergency_push", "emergency_email", "campaign_push", "updated_at"]
    search_fields = ["user_id"]
    readonly_fields = ["id", "updated_at"]
