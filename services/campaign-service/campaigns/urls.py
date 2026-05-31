from django.urls import path

from .views import (
    CampaignCancelView,
    AdminCampaignsView,
    CampaignDetailView,
    CampaignEditView,
    CampaignInterestView,
    CampaignListCreateView,
    CampaignProgressView,
    CampaignReviewView,
    MyCampaignsView,
    NearbyCampaignsView,
    PendingCampaignsView,
)

urlpatterns = [
    path("", CampaignListCreateView.as_view(), name="campaign-list-create"),
    path("nearby/", NearbyCampaignsView.as_view(), name="campaign-nearby"),
    path("mine/", MyCampaignsView.as_view(), name="campaign-mine"),
    path("admin/all/", AdminCampaignsView.as_view(), name="campaign-admin-all"),
    path("pending/", PendingCampaignsView.as_view(), name="campaign-pending"),
    path("<uuid:pk>/", CampaignDetailView.as_view(), name="campaign-detail"),
    path("<uuid:pk>/edit/", CampaignEditView.as_view(), name="campaign-edit"),
    path("<uuid:pk>/review/", CampaignReviewView.as_view(), name="campaign-review"),
    path("<uuid:pk>/progress/", CampaignProgressView.as_view(), name="campaign-progress"),
    path("<uuid:pk>/cancel/", CampaignCancelView.as_view(), name="campaign-cancel"),
    path("<uuid:pk>/interest/", CampaignInterestView.as_view(), name="campaign-interest"),
]
