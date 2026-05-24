from django.http import JsonResponse
from django.urls import path
from django_prometheus import exports
from django.contrib import admin


def health_check(_request):
    return JsonResponse({"status": "ok", "service": "campaign-service"})


urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("metrics/", exports.ExportToDjangoView, name="prometheus-metrics"),
    path("health/", health_check, name="health"),
]
