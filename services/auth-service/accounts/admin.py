from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from unfold.admin import ModelAdmin

from .models import HospitalRegistration, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin, ModelAdmin):
    ordering = ("email",)
    list_display = ("email", "role", "is_verified", "is_active", "is_staff", "created_at")
    list_filter = ("role", "is_verified", "is_active", "is_staff")
    search_fields = ("email",)
    readonly_fields = ("id", "created_at", "updated_at", "last_login")
    fieldsets = (
        ("Identity", {"fields": ("id", "email", "password")}),
        ("Role and status", {"fields": ("role", "is_verified", "is_active", "is_staff", "is_superuser")}),
        ("Google OAuth", {"fields": ("google_id", "google_access_token")}),
        ("Permissions", {"fields": ("groups", "user_permissions")}),
        ("Audit", {"fields": ("last_login", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (
            "Create user",
            {
                "classes": ("wide",),
                "fields": ("email", "role", "password1", "password2", "is_verified", "is_staff", "is_active"),
            },
        ),
    )


@admin.register(HospitalRegistration)
class HospitalRegistrationAdmin(ModelAdmin):
    list_display = ("facility_name", "facility_type", "city", "verification_status", "submitted_at", "reviewed_at")
    list_filter = ("facility_type", "verification_status", "city", "region")
    search_fields = ("facility_name", "registration_number", "user__email", "city")
    readonly_fields = ("id", "submitted_at", "reviewed_at")
