# profiles/urls.py
from django.urls import path
from .views import (
    CreateDonorProfileView,
    DonorProfileView,
    ToggleAvailabilityView,
    NearbyDonorsView,
)

urlpatterns = [
    # Internal — called by other services
    path("create-profile/", CreateDonorProfileView.as_view(), name="create-donor-profile"),
    path("nearby/",          NearbyDonorsView.as_view(),       name="nearby-donors"),

    # Donor-facing — user_id forwarded by API gateway
    path("me/",              DonorProfileView.as_view(),       name="donor-profile"),
    path("me/availability/", ToggleAvailabilityView.as_view(), name="toggle-availability"),
]