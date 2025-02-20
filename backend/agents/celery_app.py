# celery_app.py
from celery import Celery
from celery.schedules import crontab
from datetime import timedelta


celery_app = Celery(
    "tasks",
    broker="sqla+sqlite:///celery_broker.sqlite",
    backend="db+sqlite:///celery_results.sqlite"
)

# Configure Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True
)

# Change schedule to every 5 minute
celery_app.conf.beat_schedule = {
    "check_budget_every_five_minutes": {
        "task": "email_sender.check_and_send_emails",
        "schedule": timedelta(minutes=1),  # Run every 2 minutes
    },
}

# Import tasks after celery app configuration
import email_sender
