import uuid

from django.db import models


class MythArticle(models.Model):
    class MythCategory(models.TextChoices):
        HEALTH = "HEALTH", "Health"
        RELIGIOUS = "RELIGIOUS", "Religious"
        CULTURAL = "CULTURAL", "Cultural"
        PROCEDURAL = "PROCEDURAL", "Procedural"
        ELIGIBILITY = "ELIGIBILITY", "Eligibility"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    myth_statement = models.CharField(max_length=500)
    truth_statement = models.TextField()
    source = models.CharField(max_length=255, blank=True, default="")
    category = models.CharField(max_length=15, choices=MythCategory.choices, db_index=True)
    is_published = models.BooleanField(default=True, db_index=True)
    created_by = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "myth_articles"
        ordering = ["category", "title"]
        indexes = [models.Index(fields=["category", "is_published"])]

    def __str__(self):
        return self.title
