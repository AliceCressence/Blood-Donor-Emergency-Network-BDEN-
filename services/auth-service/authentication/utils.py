import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        return response

    logger.exception("Unhandled exception in %s: %s", context.get("view").__class__.__name__, str(exc))
    return Response({"detail": "An unexpected server error occurred. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
