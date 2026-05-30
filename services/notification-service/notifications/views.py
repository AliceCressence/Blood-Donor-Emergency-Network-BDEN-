# notifications/views.py
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import (
    NotificationSerializer,
    CreateNotificationSerializer,
    BulkCreateNotificationSerializer,
)


def verify_internal_key(request):
    return request.headers.get("X-Internal-API-Key") == settings.INTERNAL_API_KEY


# ── GET /api/notifications/  — get donor's notifications ──────
class ListNotificationsView(APIView):
    authentication_classes = []
    permission_classes     = []

    def get(self, request):
        user_id   = request.query_params.get("user_id")
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
    authentication_classes = []
    permission_classes     = []

    def put(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk)
        except Notification.DoesNotExist:
            return Response(
                {"detail": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        notification.read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)


# ── PUT /api/notifications/read-all/  — mark all as read ──────
class MarkAllReadView(APIView):
    authentication_classes = []
    permission_classes     = []

    def put(self, request):
        user_id = request.query_params.get("user_id")

        if not user_id:
            return Response(
                {"detail": "user_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated = Notification.objects.filter(
            user_id=user_id, read=False
        ).update(read=True)

        return Response({"marked_read": updated})