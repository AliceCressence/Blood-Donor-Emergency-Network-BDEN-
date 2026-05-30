try:
    from celery import shared_task
except ImportError:
    shared_task = None

from .services import expire_open_requests


if shared_task:
    @shared_task
    def expire_requests():
        return expire_open_requests()
