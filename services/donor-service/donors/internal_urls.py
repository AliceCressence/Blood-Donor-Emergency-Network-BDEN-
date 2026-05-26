from django.urls import path

from .internal_views import InternalCreateDonorProfileView, InternalNearbyDonorsView

urlpatterns = [
    path("donors/create-profile/", InternalCreateDonorProfileView.as_view(), name="internal-create-profile"),
    path("donors/nearby/", InternalNearbyDonorsView.as_view(), name="internal-nearby-donors"),
]
