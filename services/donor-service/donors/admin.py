from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import GroupAdmin as DjangoGroupAdmin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.models import Group
from unfold.admin import ModelAdmin as UnfoldModelAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from .models import DonationRecord, DonorProfile, ScreeningCenter, VirtualDonorCard


class UnfoldUserAdmin(DjangoUserAdmin, UnfoldModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm


class UnfoldGroupAdmin(DjangoGroupAdmin, UnfoldModelAdmin):
    pass


for model in (get_user_model(), Group):
    try:
        admin.site.unregister(model)
    except admin.sites.NotRegistered:
        pass

admin.site.register(get_user_model(), UnfoldUserAdmin)
admin.site.register(Group, UnfoldGroupAdmin)


@admin.register(DonorProfile)
class DonorProfileAdmin(UnfoldModelAdmin):
    list_display = ("get_full_name", "blood_type", "blood_type_verified", "city", "availability_status", "total_donations", "is_eligible_to_donate", "created_at")
    list_filter = ("blood_type", "blood_type_verified", "availability_status", "city")
    search_fields = ("first_name", "last_name", "phone", "city")
    readonly_fields = ("id", "user_id", "total_donations", "total_volume_ml", "created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(DonationRecord)
class DonationRecordAdmin(UnfoldModelAdmin):
    list_display = ("donor_profile", "facility_name", "volume_ml", "donation_date", "source_type")
    list_filter = ("source_type", "donation_date")
    search_fields = ("facility_name", "donor_profile__first_name", "donor_profile__last_name")
    readonly_fields = ("id", "created_at")
    ordering = ("-donation_date",)


@admin.register(VirtualDonorCard)
class VirtualDonorCardAdmin(UnfoldModelAdmin):
    list_display = ("card_number", "donor_profile", "issued_at")
    search_fields = ("card_number",)
    readonly_fields = ("id", "card_number", "issued_at")


@admin.register(ScreeningCenter)
class ScreeningCenterAdmin(UnfoldModelAdmin):
    list_display = ("name", "facility_type", "city", "phone", "is_active")
    list_filter = ("is_active", "city", "facility_type")
    search_fields = ("name", "city", "address")
    readonly_fields = ("id", "created_at")
