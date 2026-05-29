# blood_requests/urls.py
from django.urls import path
from .views import (
    CreateBloodRequestView,
    ListBloodRequestsView,
    BloodRequestDetailView,
    DonorRespondView,
    CloseBloodRequestView,
    HospitalRequestsView,
)

urlpatterns = [
    # Public / frontend endpoints
    path("",                              ListBloodRequestsView.as_view(),   name="list-requests"),
    path("<uuid:pk>/",                    BloodRequestDetailView.as_view(),  name="request-detail"),
    path("<uuid:pk>/respond/",            DonorRespondView.as_view(),        name="donor-respond"),

    # Internal endpoints (API gateway / hospital portal)
    path("create/",                       CreateBloodRequestView.as_view(),  name="create-request"),
    path("<uuid:pk>/close/",              CloseBloodRequestView.as_view(),   name="close-request"),
    path("hospital/<uuid:hospital_id>/",  HospitalRequestsView.as_view(),    name="hospital-requests"),
]