from django.utils import timezone

from .models import Notification, NotificationPreference


def get_preferences(user_id):
    preferences, _created = NotificationPreference.objects.get_or_create(user_id=user_id)
    return preferences


def create_notification(**kwargs):
    notification = Notification.objects.create(**kwargs)
    return notification


def mark_notifications_read(user_id, notification_ids=None, mark_all=False):
    qs = Notification.objects.filter(user_id=user_id, read=False)
    if not mark_all:
        qs = qs.filter(id__in=notification_ids or [])
    updated = qs.update(read=True, read_at=timezone.now())
    return updated


def unread_count(user_id):
    return Notification.objects.filter(user_id=user_id, read=False).count()
