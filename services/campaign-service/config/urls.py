from django.contrib import admin
from django.views.generic import RedirectView
from django.urls import include, path
from django_prometheus import exports
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework.permissions import AllowAny

from . import admin_overrides  # noqa: F401

schema_view = get_schema_view(
    openapi.Info(
        title="BDEN Campaign Service API",
        default_version="v1",
        description=(
            "Manages donation campaigns and myth-debunking articles. Campaigns require admin approval "
            "before becoming publicly visible. Myth articles are admin-managed and publicly readable."
        ),
        contact=openapi.Contact(email="dev@bden.cm"),
    ),
    public=True,
    permission_classes=[AllowAny],
)

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("admin/", RedirectView.as_view(url="/django-admin/", permanent=False)),
    path("api/campaigns/", include("campaigns.urls")),
    path("api/myths/", include("myths.urls")),
    path("api/docs/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("api/redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
    path("swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui-legacy"),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc-legacy"),
    path("metrics/", exports.ExportToDjangoView, name="prometheus-metrics"),
    path("health/", include("campaigns.health_urls")),
]
