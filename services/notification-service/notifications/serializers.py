# notifications/serializers.py
from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = [
            "id", "user_id", "type", "title",
            "body", "read", "data", "email_status", "sent_at",
            "read_at", "created_at",
        ]
        read_only_fields = ["id", "email_status", "sent_at", "read_at", "created_at"]


class CreateNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = ["user_id", "type", "title", "body", "data"]

    def validate_type(self, value):
        valid = ["EMERGENCY", "CAMPAIGN", "SYSTEM", "REMINDER"]
        if value not in valid:
            raise serializers.ValidationError(
                f"Invalid type. Must be one of: {', '.join(valid)}"
            )
        return value


class BulkCreateNotificationSerializer(serializers.Serializer):
    user_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1
    )
    type  = serializers.ChoiceField(choices=["EMERGENCY", "CAMPAIGN", "SYSTEM", "REMINDER"])
    title = serializers.CharField(max_length=255)
    body  = serializers.CharField()
    data  = serializers.DictField(default=dict, required=False)


class MarkReadSerializer(serializers.Serializer):
    notification_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True,
    )
    all = serializers.BooleanField(default=False)


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            "id", "user_id", "emergency_push", "emergency_email",
            "campaign_push", "campaign_email", "system_push",
            "system_email", "quiet_hours_start", "quiet_hours_end",
            "updated_at",
        ]
        read_only_fields = ["id", "user_id", "updated_at"]
