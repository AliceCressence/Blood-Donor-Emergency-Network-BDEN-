# config/urls.py
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django_prometheus import exports


def health_check(_request):
    return JsonResponse({"status": "ok", "service": "donor-service"})


urlpatterns = [
    path("django-admin/", admin.site.urls),

    # Internal routes — service-to-service only (protected by X-Internal-API-Key)
    path("internal/donors/", include("profiles.urls")),

    # Public donor routes — API gateway forwards X-User-Id header
    path("api/donors/",      include("profiles.urls")),

    # Observability
    path("metrics/", exports.ExportToDjangoView, name="prometheus-metrics"),
    path("health/",  health_check,               name="health"),
]