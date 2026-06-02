from django.urls import path

from .views import ActiveDonorBannerView, AdminDonorBannerDetailView, AdminDonorBannerListCreateView

urlpatterns = [
    path("donor-dashboard/active/", ActiveDonorBannerView.as_view(), name="donor-banner-active"),
    path("donor-dashboard/admin/", AdminDonorBannerListCreateView.as_view(), name="donor-banner-admin-list"),
    path("donor-dashboard/admin/<uuid:pk>/", AdminDonorBannerDetailView.as_view(), name="donor-banner-admin-detail"),
]
