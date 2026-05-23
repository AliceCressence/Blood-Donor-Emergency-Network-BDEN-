from django.urls import path

from .views import CreateDonorProfileView

urlpatterns = [
    path("create-profile/", CreateDonorProfileView.as_view(), name="create-donor-profile"),
]
