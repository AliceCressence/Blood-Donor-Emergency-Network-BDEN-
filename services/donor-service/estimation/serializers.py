from rest_framework import serializers

from .models import BloodTypeEstimationSession


class ChatMessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000, allow_blank=False, trim_whitespace=True)


class ChatResponseSerializer(serializers.Serializer):
    reply = serializers.CharField()
    session_id = serializers.UUIDField()
    session_complete = serializers.BooleanField()
    estimation_result = serializers.CharField(allow_null=True)


class EstimationSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodTypeEstimationSession
        fields = ["id", "messages", "estimation_result", "confidence_note", "completed", "created_at", "updated_at"]
