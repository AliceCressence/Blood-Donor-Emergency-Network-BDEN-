from dataclasses import dataclass

from rest_framework_simplejwt.authentication import JWTAuthentication


@dataclass
class ServiceUser:
    user_id: str
    role: str = ""
    is_verified: bool = False

    @property
    def id(self):
        return self.user_id

    @property
    def is_authenticated(self):
        return True


class ServiceJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        return ServiceUser(
            user_id=str(validated_token.get("user_id")),
            role=validated_token.get("role", ""),
            is_verified=bool(validated_token.get("is_verified", False)),
        )
