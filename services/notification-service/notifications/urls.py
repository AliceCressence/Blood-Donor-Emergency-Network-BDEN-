# notifications/urls.py
from django.urls import path
from .views import (
    ListNotificationsView,
    CreateNotificationView,
    BulkCreateNotificationView,
    MarkReadBatchView,
    MarkReadView,
    MarkAllReadView,
    NotificationPreferenceView,
    UnreadCountView,
)

urlpatterns = [
    # Frontend / donor endpoints
    path("",                  ListNotificationsView.as_view(),       name="list-notifications"),
    path("mark-read/",        MarkReadBatchView.as_view(),           name="mark-read-batch"),
    path("read-all/",         MarkAllReadView.as_view(),             name="mark-all-read"),
    path("unread-count/",     UnreadCountView.as_view(),             name="unread-count"),
    path("preferences/",      NotificationPreferenceView.as_view(),  name="notification-preferences"),
    path("<uuid:pk>/read/",   MarkReadView.as_view(),                name="mark-read"),

    # Internal endpoints
    path("create/",           CreateNotificationView.as_view(),      name="create-notification"),
    path("bulk/",             BulkCreateNotificationView.as_view(),  name="bulk-create"),
]
