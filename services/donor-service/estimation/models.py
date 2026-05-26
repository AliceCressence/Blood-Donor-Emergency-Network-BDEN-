import uuid

from django.db import models

from donors.models import DonorProfile


class BloodTypeEstimationSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    donor_profile = models.ForeignKey(DonorProfile, on_delete=models.CASCADE, related_name="estimation_sessions")
    messages = models.JSONField(default=list)
    estimation_result = models.CharField(max_length=200, blank=True, default="")
    confidence_note = models.TextField(blank=True, default="")
    completed = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "estimation_sessions"
        ordering = ["-created_at"]

    def add_message(self, role, content):
        self.messages.append({"role": role, "content": content})
        self.save(update_fields=["messages", "updated_at"])

    def mark_completed(self, result, note):
        self.estimation_result = result
        self.confidence_note = note
        self.completed = True
        self.save(update_fields=["estimation_result", "confidence_note", "completed", "updated_at"])

    def get_gemini_history(self):
        return [{"role": msg["role"], "parts": [msg["content"]]} for msg in self.messages]
