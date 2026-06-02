from django.shortcuts import get_object_or_404
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from campaigns.permissions import IsAdmin
from .models import MythArticle
from .serializers import CreateMythArticleSerializer, MythArticleSerializer, UpdateMythArticleSerializer
from .services import MythService


class MythListView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="List published myths",
        manual_parameters=[openapi.Parameter("category", openapi.IN_QUERY, type=openapi.TYPE_STRING)],
        responses={200: MythArticleSerializer(many=True)},
        tags=["Myths"],
    )
    def get(self, request):
        articles = MythService().get_published(category=request.query_params.get("category"))
        return Response(MythArticleSerializer(articles, many=True).data)


class MythDetailView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(operation_summary="Published myth detail", responses={200: MythArticleSerializer, 404: "Not found"}, tags=["Myths"])
    def get(self, _request, pk):
        article = get_object_or_404(MythArticle, pk=pk, is_published=True)
        return Response(MythArticleSerializer(article).data)


class MythCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @swagger_auto_schema(operation_summary="Create myth article", request_body=CreateMythArticleSerializer, responses={201: MythArticleSerializer}, tags=["Myth Admin"])
    def post(self, request):
        serializer = CreateMythArticleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        article = MythService().create_article(request.user.id, serializer.validated_data)
        return Response(MythArticleSerializer(article).data, status=status.HTTP_201_CREATED)


class MythEditView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @swagger_auto_schema(operation_summary="Edit myth article", request_body=UpdateMythArticleSerializer, responses={200: MythArticleSerializer}, tags=["Myth Admin"])
    def patch(self, request, pk):
        article = get_object_or_404(MythArticle, pk=pk)
        serializer = UpdateMythArticleSerializer(article, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        article = MythService().update_article(article, serializer.validated_data)
        return Response(MythArticleSerializer(article).data)
