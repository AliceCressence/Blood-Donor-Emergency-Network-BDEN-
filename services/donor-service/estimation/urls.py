from django.urls import path

from . import views

urlpatterns = [
    path("chat/", views.ChatView.as_view(), name="estimation-chat"),
    path("session/", views.EstimationSessionView.as_view(), name="estimation-session"),
]
