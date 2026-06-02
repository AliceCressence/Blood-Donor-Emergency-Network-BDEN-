from django.http import JsonResponse
from django.urls import path


def health_check(_request):
    return JsonResponse({"status": "ok", "service": "campaign-service"})


urlpatterns = [path("", health_check, name="health")]
