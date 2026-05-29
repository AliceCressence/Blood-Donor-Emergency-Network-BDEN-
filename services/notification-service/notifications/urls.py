# notifications/urls.py
from django.urls import path
from .views import (
    ListNotificationsView,
    CreateNotificationView,
    BulkCreateNotificationView,
    MarkReadView,
    MarkAllReadView,
)

urlpatterns = [
    # Frontend / donor endpoints
    path("",                  ListNotificationsView.as_view(),       name="list-notifications"),
    path("read-all/",         MarkAllReadView.as_view(),             name="mark-all-read"),
    path("<uuid:pk>/read/",   MarkReadView.as_view(),                name="mark-read"),

    # Internal endpoints
    path("create/",           CreateNotificationView.as_view(),      name="create-notification"),
    path("bulk/",             BulkCreateNotificationView.as_view(),  name="bulk-create"),
]