from django.contrib import admin
from django.urls import include, path
from django_prometheus import exports
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework.permissions import AllowAny

schema_view = get_schema_view(
    openapi.Info(
        title="BDEN Donor Service API",
        default_version="v1",
        description=(
            "Manages donor profiles, donation history, virtual donor cards, "
            "blood type estimation sessions, screening centers, and nearby donor search."
        ),
        contact=openapi.Contact(email="dev@bden.cm"),
        license=openapi.License(name="MIT"),
    ),
    public=True,
    permission_classes=[AllowAny],
)

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/donors/", include("donors.urls")),
    path("api/estimation/", include("estimation.urls")),
    path("internal/", include("donors.internal_urls")),
    path("api/docs/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("api/redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
    path("api/schema.json", schema_view.without_ui(cache_timeout=0), name="schema-json"),
    path("metrics/", exports.ExportToDjangoView, name="prometheus-metrics"),
    path("health/", include("donors.health_urls")),
]
