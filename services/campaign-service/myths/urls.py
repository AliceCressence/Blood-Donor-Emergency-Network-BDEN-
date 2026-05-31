from django.urls import path

from .views import MythCreateView, MythDetailView, MythEditView, MythListView

urlpatterns = [
    path("", MythListView.as_view(), name="myth-list"),
    path("create/", MythCreateView.as_view(), name="myth-create"),
    path("<uuid:pk>/", MythDetailView.as_view(), name="myth-detail"),
    path("<uuid:pk>/edit/", MythEditView.as_view(), name="myth-edit"),
]
