# notifications/views.py
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import (
    BulkCreateNotificationSerializer,
    CreateNotificationSerializer,
    MarkReadSerializer,
    NotificationPreferenceSerializer,
    NotificationSerializer,
)
from .services import get_preferences, mark_notifications_read, unread_count


def verify_internal_key(request):
    return request.headers.get("X-Internal-API-Key") == settings.INTERNAL_API_KEY


def resolve_user_id(request):
    return request.query_params.get("user_id") or request.data.get("user_id") or getattr(request.user, "id", None)


# ── GET /api/notifications/  — get donor's notifications ──────
class ListNotificationsView(APIView):
    permission_classes = []

    def get(self, request):
        user_id = resolve_user_id(request)
        notif_type = request.query_params.get("type")
        unread_only = request.query_params.get("unread") == "true"

        if not user_id:
            return Response(
                {"detail": "user_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        qs = Notification.objects.filter(user_id=user_id)

        if notif_type:
            qs = qs.filter(type=notif_type)
        if unread_only:
            qs = qs.filter(read=False)

        serializer = NotificationSerializer(qs, many=True)
        return Response({
            "notifications": serializer.data,
            "unread_count":  qs.filter(read=False).count(),
        })


# ── POST /internal/notifications/  — create one notification ──
class CreateNotificationView(APIView):
    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        if not verify_internal_key(request):
            return Response(
                {"detail": "Invalid internal API key."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CreateNotificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        notification = serializer.save()

        return Response(
            NotificationSerializer(notification).data,
            status=status.HTTP_201_CREATED
        )


# ── POST /internal/notifications/bulk/  — send to many donors ─
class BulkCreateNotificationView(APIView):
    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        if not verify_internal_key(request):
            return Response(
                {"detail": "Invalid internal API key."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = BulkCreateNotificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data     = serializer.validated_data
        user_ids = data["user_ids"]

        notifications = [
            Notification(
                user_id = user_id,
                type    = data["type"],
                title   = data["title"],
                body    = data["body"],
                data    = data.get("data", {}),
            )
            for user_id in user_ids
        ]

        Notification.objects.bulk_create(notifications)

        return Response(
            {"created": len(notifications)},
            status=status.HTTP_201_CREATED
        )


# ── PUT /api/notifications/<id>/read/  — mark one as read ─────
class MarkReadView(APIView):
    permission_classes = []

    def put(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk)
        except Notification.DoesNotExist:
            return Response(
                {"detail": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        notification.read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=["read", "read_at"])
        return Response(NotificationSerializer(notification).data)


class MarkReadBatchView(APIView):
    permission_classes = []

    def post(self, request):
        user_id = resolve_user_id(request)
        if not user_id:
            return Response(
                {"detail": "A JWT user or user_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = MarkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = mark_notifications_read(
            user_id=user_id,
            notification_ids=serializer.validated_data.get("notification_ids"),
            mark_all=serializer.validated_data.get("all", False),
        )
        return Response({"marked_read": updated, "unread_count": unread_count(user_id)})


# ── PUT /api/notifications/read-all/  — mark all as read ──────
class MarkAllReadView(APIView):
    permission_classes = []

    def put(self, request):
        user_id = resolve_user_id(request)

        if not user_id:
            return Response(
                {"detail": "user_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated = Notification.objects.filter(
            user_id=user_id, read=False
        ).update(read=True, read_at=timezone.now())

        return Response({"marked_read": updated})


class UnreadCountView(APIView):
    permission_classes = []

    def get(self, request):
        user_id = resolve_user_id(request)
        if not user_id:
            return Response(
                {"detail": "A JWT user or user_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"unread_count": unread_count(user_id)})


class NotificationPreferenceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        preferences = get_preferences(request.user.id)
        return Response(NotificationPreferenceSerializer(preferences).data)

    def put(self, request):
        preferences = get_preferences(request.user.id)
        serializer = NotificationPreferenceSerializer(
            preferences,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
