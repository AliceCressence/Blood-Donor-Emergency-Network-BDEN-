try:
    from celery import shared_task
except ImportError:
    shared_task = None

from .events import handle_event


if shared_task:
    @shared_task
    def consume_notification_event(message):
        result = handle_event(message)
        return str(result.id) if result else None
