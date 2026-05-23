from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django_prometheus import exports

from authentication.urls import admin_urlpatterns, auth_urlpatterns


def health_check(_request):
    return JsonResponse({"status": "ok", "service": "auth-service"})


urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/auth/", include((auth_urlpatterns, "auth"))),
    path("api/admin/", include((admin_urlpatterns, "admin"))),
    path("metrics/", exports.ExportToDjangoView, name="prometheus-metrics"),
    path("health/", health_check, name="health"),
]
