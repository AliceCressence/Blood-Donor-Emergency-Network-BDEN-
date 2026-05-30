# blood_requests/urls.py
from django.urls import path
from .views import (
    CreateBloodRequestView,
    ListBloodRequestsView,
    BloodRequestDetailView,
    BulkRequestResponsesView,
    CancelBloodRequestView,
    DonorRespondView,
    CloseBloodRequestView,
    HospitalRequestsView,
    MyHospitalRequestsView,
    RequestResponsesView,
)

urlpatterns = [
    # Spec-compatible public / frontend endpoints
    path("",                              CreateBloodRequestView.as_view(),  name="create-request-spec"),
    path("active/",                       ListBloodRequestsView.as_view(),   name="active-requests"),
    path("mine/",                         MyHospitalRequestsView.as_view(),  name="my-hospital-requests"),
    path("<uuid:pk>/",                    BloodRequestDetailView.as_view(),  name="request-detail"),
    path("<uuid:pk>/respond/",            DonorRespondView.as_view(),        name="donor-respond"),
    path("<uuid:pk>/responses/",          RequestResponsesView.as_view(),    name="request-responses"),
    path("<uuid:pk>/cancel/",             CancelBloodRequestView.as_view(),  name="cancel-request"),

    # Backward-compatible aliases and internal endpoints
    path("list/",                         ListBloodRequestsView.as_view(),   name="list-requests-legacy"),
    path("create/",                       CreateBloodRequestView.as_view(),  name="create-request"),
    path("<uuid:pk>/close/",              CloseBloodRequestView.as_view(),   name="close-request"),
    path("<uuid:pk>/responses/bulk/",      BulkRequestResponsesView.as_view(), name="bulk-request-responses"),
    path("hospital/<uuid:hospital_id>/",  HospitalRequestsView.as_view(),    name="hospital-requests"),
]
