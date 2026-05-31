from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import MythArticle


@admin.register(MythArticle)
class MythArticleAdmin(ModelAdmin):
    list_display = ("title", "category", "is_published", "source", "updated_at")
    list_filter = ("category", "is_published")
    search_fields = ("title", "myth_statement", "truth_statement", "source")
    readonly_fields = ("id", "created_at", "updated_at")
    actions = ("publish_articles", "unpublish_articles")

    @admin.action(description="Publish selected myth articles")
    def publish_articles(self, _request, queryset):
        queryset.update(is_published=True)

    @admin.action(description="Unpublish selected myth articles")
    def unpublish_articles(self, _request, queryset):
        queryset.update(is_published=False)
