from django.http import JsonResponse
from django.urls import path
from django_prometheus import exports


def health_check(_request):
    return JsonResponse({"status": "ok", "service": "notification-service"})


urlpatterns = [
    path("metrics/", exports.ExportToDjangoView, name="prometheus-metrics"),
    path("health/", health_check, name="health"),
]
