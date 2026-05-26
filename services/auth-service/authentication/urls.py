from django.urls import path

from .views import (
    DonorRegisterView,
    GoogleAuthCallbackView,
    GoogleAuthInitView,
    HospitalRegisterView,
    HospitalVerificationView,
    LoginView,
    LogoutView,
    MeView,
    PendingHospitalsView,
    TokenRefreshView,
)

auth_urlpatterns = [
    path("register/donor/", DonorRegisterView.as_view(), name="donor-register"),
    path("register/hospital/", HospitalRegisterView.as_view(), name="hospital-register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("google/", GoogleAuthInitView.as_view(), name="google-auth-init"),
    path("google/callback/", GoogleAuthCallbackView.as_view(), name="google-callback"),
    path("me/", MeView.as_view(), name="me"),
]

admin_urlpatterns = [
    path("hospitals/pending/", PendingHospitalsView.as_view(), name="hospitals-pending"),
    path("hospitals/<uuid:user_id>/verify/", HospitalVerificationView.as_view(), name="hospital-verify"),
]
