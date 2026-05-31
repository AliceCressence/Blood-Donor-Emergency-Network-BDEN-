from rest_framework import serializers

from .models import MythArticle


class MythArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MythArticle
        fields = [
            "id",
            "title",
            "myth_statement",
            "truth_statement",
            "source",
            "category",
            "is_published",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]


class CreateMythArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MythArticle
        fields = ["title", "myth_statement", "truth_statement", "source", "category", "is_published"]


class UpdateMythArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MythArticle
        fields = ["title", "myth_statement", "truth_statement", "source", "category", "is_published"]
        extra_kwargs = {
            "title": {"required": False},
            "myth_statement": {"required": False},
            "truth_statement": {"required": False},
            "source": {"required": False},
            "category": {"required": False},
            "is_published": {"required": False},
        }
