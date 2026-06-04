FROM python:3.11-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p staticfiles
EXPOSE 8004
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8004"]
