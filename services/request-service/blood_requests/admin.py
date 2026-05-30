# blood_requests/admin.py
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import GroupAdmin as DjangoGroupAdmin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.models import Group
from unfold.admin import ModelAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm
from .models import BloodRequest, MatchingResult, RequestResponse


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


@admin.register(BloodRequest)
class BloodRequestAdmin(ModelAdmin):
    list_display  = ["hospital_name", "blood_type", "urgency", "status", "city", "created_at"]
    list_filter   = ["status", "urgency", "blood_type"]
    search_fields = ["hospital_name", "city", "blood_type"]
    readonly_fields = ["id", "created_at", "fulfilled_at", "cancelled_at"]


@admin.register(RequestResponse)
class RequestResponseAdmin(ModelAdmin):
    list_display  = ["request", "donor_id", "donor_name", "status", "distance_km", "responded_at"]
    list_filter   = ["status"]
    search_fields = ["donor_id", "donor_name", "donor_phone"]
    readonly_fields = ["id", "responded_at"]


@admin.register(MatchingResult)
class MatchingResultAdmin(ModelAdmin):
    list_display = ["request", "donor_id", "distance_km", "compatibility_score", "created_at"]
    search_fields = ["donor_id"]
    readonly_fields = ["id", "created_at"]
