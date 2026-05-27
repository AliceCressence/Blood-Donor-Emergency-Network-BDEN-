from django.urls import path

from .internal_views import InternalCreateDonorProfileView, InternalDonorProfileStatusView, InternalNearbyDonorsView

urlpatterns = [
    path("donors/create-profile/", InternalCreateDonorProfileView.as_view(), name="internal-create-profile"),
    path("donors/profile-status/", InternalDonorProfileStatusView.as_view(), name="internal-profile-status"),
    path("donors/nearby/", InternalNearbyDonorsView.as_view(), name="internal-nearby-donors"),
]
