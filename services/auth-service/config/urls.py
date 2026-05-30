from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django_prometheus import exports
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

from authentication.urls import admin_urlpatterns, auth_urlpatterns

schema_view = get_schema_view(
    openapi.Info(
        title="BDEN Auth Service API",
        default_version="v1",
        description=(
            "Authentication, authorization, role management, donor registration, "
            "hospital registration, Google OAuth, and admin hospital verification APIs."
        ),
        contact=openapi.Contact(email="platform@bden.cm"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)


def health_check(_request):
    return JsonResponse({"status": "ok", "service": "auth-service"})


urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/docs/swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("api/docs/redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
    path("api/schema.json", schema_view.without_ui(cache_timeout=0), name="schema-json"),
    path("api/auth/", include((auth_urlpatterns, "auth"))),
    path("api/admin/", include((admin_urlpatterns, "admin_api"))),
    path("metrics/", exports.ExportToDjangoView, name="prometheus-metrics"),
    path("health/", health_check, name="health"),
]
