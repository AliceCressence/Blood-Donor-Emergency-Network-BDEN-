# notifications/serializers.py
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = [
            "id", "user_id", "type", "title",
            "body", "read", "data", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class CreateNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = ["user_id", "type", "title", "body", "data"]

    def validate_type(self, value):
        valid = ["EMERGENCY", "CAMPAIGN", "SYSTEM"]
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
    type  = serializers.ChoiceField(choices=["EMERGENCY", "CAMPAIGN", "SYSTEM"])
    title = serializers.CharField(max_length=255)
    body  = serializers.CharField()
    data  = serializers.DictField(default=dict, required=False)