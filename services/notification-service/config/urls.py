# config/urls.py
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django_prometheus import exports
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions


def health_check(_request):
    return JsonResponse({"status": "ok", "service": "notification-service"})


schema_view = get_schema_view(
    openapi.Info(
        title="BDEN Notification Service API",
        default_version="v1",
        description="User notifications, read states, preferences, and internal notification dispatch.",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)


urlpatterns = [
    path("django-admin/",        admin.site.urls),
    path("api/notifications/",   include("notifications.urls")),
    path("swagger/",             schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("redoc/",               schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
    path("metrics/",             exports.ExportToDjangoView, name="prometheus-metrics"),
    path("health/",              health_check, name="health"),
]
