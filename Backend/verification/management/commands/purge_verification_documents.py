from django.core.management.base import BaseCommand
from django.utils import timezone

from verification.models import VerificationDocument
from verification.services import audit


class Command(BaseCommand):
    help = "Purge encrypted verification document payloads whose retention window has expired while preserving metadata and audit history."

    def handle(self, *args, **options):
        now = timezone.now()
        documents = VerificationDocument.objects.select_related("submission").filter(
            purged_at__isnull=True,
            retention_until__isnull=False,
            retention_until__lte=now,
        )
        count = 0
        for document in documents.iterator():
            document.encrypted_payload = b""
            document.purged_at = now
            document.save(update_fields=["encrypted_payload", "purged_at"])
            audit(
                document.submission,
                "document_purged",
                old=document.submission.status,
                new=document.submission.status,
                metadata={"document_id": str(document.id), "kind": document.kind, "version": document.submission_version},
            )
            count += 1
        self.stdout.write(self.style.SUCCESS(f"Purged {count} expired verification document payload(s)."))
