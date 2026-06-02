from rest_framework import serializers

from .models import DonorDashboardBanner


class DonorDashboardBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonorDashboardBanner
        fields = ["id", "title", "image_url", "alt_text", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class CreateDonorDashboardBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonorDashboardBanner
        fields = ["title", "image_url", "alt_text", "is_active"]


class UpdateDonorDashboardBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonorDashboardBanner
        fields = ["title", "image_url", "alt_text", "is_active"]
        extra_kwargs = {field: {"required": False} for field in fields}
