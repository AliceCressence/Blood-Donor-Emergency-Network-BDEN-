from .models import MythArticle


class MythService:
    def get_published(self, category=None):
        qs = MythArticle.objects.filter(is_published=True)
        if category:
            qs = qs.filter(category=category)
        return qs

    def get_article(self, article_id):
        return MythArticle.objects.get(id=article_id, is_published=True)

    def create_article(self, admin_user_id, data):
        return MythArticle.objects.create(created_by=admin_user_id, **data)

    def update_article(self, article, data):
        for field, value in data.items():
            setattr(article, field, value)
        article.save()
        return article
