from django.urls import path

from . import views

urlpatterns = [
    path("me/", views.DonorProfileView.as_view(), name="donor-profile"),
    path("me/blood-type/", views.BloodTypeView.as_view(), name="donor-blood-type"),
    path("me/toggle-availability/", views.AvailabilityToggleView.as_view(), name="donor-toggle-availability"),
    path("me/card/", views.DonorCardView.as_view(), name="donor-card"),
    path("me/donations/", views.DonationHistoryView.as_view(), name="donor-donation-history"),
    path("donations/record/", views.RecordDonationView.as_view(), name="record-donation"),
    path("screening-centers/", views.ScreeningCentersView.as_view(), name="screening-centers"),
]
