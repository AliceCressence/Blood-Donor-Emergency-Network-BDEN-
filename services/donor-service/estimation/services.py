import logging

from .models import BloodTypeEstimationSession

logger = logging.getLogger(__name__)

BLOOD_TYPE_ESTIMATION_SYSTEM_PROMPT = """
You are a medical information assistant helping users understand their likely blood type based on family history and inheritance patterns.
Always explain that only a laboratory test can confirm blood type. When ready, include "ESTIMATION COMPLETE:" followed by the short result.
"""

_STUB_RESPONSES = [
    "Thanks for reaching out! To help estimate your blood type, could you tell me if you know either of your parents' blood types?",
    "Helpful context! Blood type is inherited through ABO and Rh genes. Do you know whether any siblings or close relatives have been typed?",
    "Based on what you've shared, I can offer a general estimate. However, only a laboratory test can confirm your actual blood type. ESTIMATION COMPLETE: Likely A+ or O+ (unconfirmed). Please visit a nearby screening center for a definitive result.",
]


class GeminiChatService:
    def __init__(self):
        self._stub_mode = True
        logger.info("GeminiChatService running in STUB mode (Gemini deferred to V2).")

    def send_message(self, session: BloodTypeEstimationSession, user_message: str):
        if session.completed:
            raise ValueError("This estimation session is already complete.")
        session.add_message("user", user_message)
        ai_text = self._call_stub(session)
        session.add_message("model", ai_text)
        if "ESTIMATION COMPLETE:" in ai_text:
            short_result = ai_text.split("ESTIMATION COMPLETE:")[1].split("\n")[0][:150].strip()
            session.mark_completed(short_result, ai_text)
            profile = session.donor_profile
            profile.blood_type_estimated = short_result
            profile.save(update_fields=["blood_type_estimated", "updated_at"])
        return {
            "reply": ai_text,
            "session_id": str(session.id),
            "session_complete": session.completed,
            "estimation_result": session.estimation_result or None,
        }

    def _call_stub(self, session):
        user_message_count = sum(1 for msg in session.messages if msg.get("role") == "user")
        return _STUB_RESPONSES[min(user_message_count - 1, len(_STUB_RESPONSES) - 1)]

    def get_or_create_active_session(self, donor_profile):
        session = BloodTypeEstimationSession.objects.filter(donor_profile=donor_profile, completed=False).order_by("-created_at").first()
        if session is None:
            session = BloodTypeEstimationSession.objects.create(donor_profile=donor_profile, messages=[])
        return session
