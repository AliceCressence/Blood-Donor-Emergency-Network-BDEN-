import pytest

from estimation.models import BloodTypeEstimationSession
from estimation.services import GeminiChatService


@pytest.mark.django_db
def test_stub_chat_lifecycle(donor_profile):
    donor_profile.blood_type_verified = False
    donor_profile.save()
    service = GeminiChatService()
    session = service.get_or_create_active_session(donor_profile)
    result1 = service.send_message(session, "I do not know my type")
    assert result1["session_complete"] is False
    result2 = service.send_message(session, "My mother is O+")
    assert result2["session_complete"] is False
    result3 = service.send_message(session, "My sibling is A+")
    assert result3["session_complete"] is True
    session.refresh_from_db()
    donor_profile.refresh_from_db()
    assert session.estimation_result
    assert donor_profile.blood_type_estimated
    with pytest.raises(ValueError):
        service.send_message(session, "Again")


@pytest.mark.django_db
def test_get_or_create_active_session(donor_profile):
    service = GeminiChatService()
    session = service.get_or_create_active_session(donor_profile)
    assert service.get_or_create_active_session(donor_profile) == session
    session.completed = True
    session.save()
    assert service.get_or_create_active_session(donor_profile) != session


@pytest.mark.django_db
def test_get_gemini_history(donor_profile):
    session = BloodTypeEstimationSession.objects.create(donor_profile=donor_profile, messages=[{"role": "user", "content": "hello"}])
    assert session.get_gemini_history() == [{"role": "user", "parts": ["hello"]}]
