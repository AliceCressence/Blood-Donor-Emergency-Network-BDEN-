from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django_prometheus import exports


def health_check(_request):
    return JsonResponse({"status": "ok", "service": "donor-service"})


urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("internal/donors/", include("profiles.urls")),
    path("metrics/", exports.ExportToDjangoView, name="prometheus-metrics"),
    path("health/", health_check, name="health"),
]
