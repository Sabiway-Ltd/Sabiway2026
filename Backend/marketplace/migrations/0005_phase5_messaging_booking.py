import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def populate_booking_professional(apps, schema_editor):
    BookingRequest = apps.get_model("marketplace", "BookingRequest")
    for booking in BookingRequest.objects.select_related("listing").filter(professional__isnull=True, listing__isnull=False):
        booking.professional_id = booking.listing.provider_id
        booking.save(update_fields=["professional"])


class Migration(migrations.Migration):
    dependencies = [
        ("marketplace", "0004_phase4_seed_subcategories"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="MessageThread",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("status", models.CharField(choices=[("open", "Open"), ("closed", "Closed")], default="open", max_length=20)),
                ("last_message_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("client", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="client_message_threads", to="profiles.profile")),
                ("professional", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="professional_message_threads", to="profiles.profile")),
                ("listing", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="message_threads", to="marketplace.servicelisting")),
                ("job", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="message_threads", to="marketplace.jobposting")),
                ("job_response", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="message_threads", to="marketplace.jobresponse")),
            ],
            options={"ordering": ["-last_message_at", "-created_at"]},
        ),
        migrations.CreateModel(
            name="Message",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("body", models.TextField(blank=True)),
                ("attachment", models.FileField(blank=True, null=True, upload_to="marketplace/messages/%Y/%m/")),
                ("attachment_name", models.CharField(blank=True, max_length=255)),
                ("attachment_content_type", models.CharField(blank=True, max_length=100)),
                ("attachment_size", models.PositiveIntegerField(default=0)),
                ("is_read", models.BooleanField(default=False)),
                ("read_at", models.DateTimeField(blank=True, null=True)),
                ("is_system", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("sender", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="marketplace_messages", to="profiles.profile")),
                ("thread", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="marketplace.messagethread")),
            ],
            options={"ordering": ["created_at"]},
        ),
        migrations.CreateModel(
            name="ConversationBlock",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("blocked", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="marketplace_blocks_received", to="profiles.profile")),
                ("blocker", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="marketplace_blocks_created", to="profiles.profile")),
                ("thread", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="blocks", to="marketplace.messagethread")),
            ],
            options={"unique_together": {("blocker", "blocked")}},
        ),
        migrations.CreateModel(
            name="ConversationReport",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("reason", models.CharField(choices=[("harassment", "Harassment"), ("spam", "Spam"), ("fraud", "Fraud or scam"), ("contact_policy", "Contact detail policy"), ("other", "Other")], max_length=30)),
                ("details", models.TextField(blank=True)),
                ("status", models.CharField(choices=[("open", "Open"), ("reviewed", "Reviewed"), ("dismissed", "Dismissed"), ("actioned", "Actioned")], default="open", max_length=20)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("message", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reports", to="marketplace.message")),
                ("reported_user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="conversation_reports_received", to="profiles.profile")),
                ("reporter", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="conversation_reports", to="profiles.profile")),
                ("reviewed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reviewed_conversation_reports", to=settings.AUTH_USER_MODEL)),
                ("thread", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reports", to="marketplace.messagethread")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AlterField(
            model_name="bookingrequest",
            name="listing",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="booking_requests", to="marketplace.servicelisting"),
        ),
        migrations.AddField(model_name="bookingrequest", name="professional", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="professional_bookings", to="profiles.profile")),
        migrations.AddField(model_name="bookingrequest", name="thread", field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="booking", to="marketplace.messagethread")),
        migrations.AddField(model_name="bookingrequest", name="job", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="bookings", to="marketplace.jobposting")),
        migrations.AddField(model_name="bookingrequest", name="job_response", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="bookings", to="marketplace.jobresponse")),
        migrations.AddField(model_name="bookingrequest", name="scope_summary", field=models.TextField(blank=True)),
        migrations.AddField(model_name="bookingrequest", name="agreed_price", field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
        migrations.AddField(model_name="bookingrequest", name="currency", field=models.CharField(default="NGN", max_length=3)),
        migrations.AddField(model_name="bookingrequest", name="timezone", field=models.CharField(default="UTC", max_length=64)),
        migrations.AddField(model_name="bookingrequest", name="schedule_status", field=models.CharField(choices=[("not_set", "Not set"), ("proposed", "Proposed"), ("accepted", "Accepted"), ("change_requested", "Change requested")], default="not_set", max_length=24)),
        migrations.AddField(model_name="bookingrequest", name="accepted_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.AlterField(model_name="bookingrequest", name="status", field=models.CharField(choices=[("pending", "Pending professional acceptance"), ("accepted", "Accepted"), ("declined", "Declined"), ("cancelled", "Cancelled"), ("in_progress", "In progress"), ("completed", "Completed")], default="pending", max_length=20)),
        migrations.RunPython(populate_booking_professional, migrations.RunPython.noop),
        migrations.CreateModel(
            name="ScheduleProposal",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("proposed_for", models.DateTimeField()),
                ("timezone", models.CharField(default="UTC", max_length=64)),
                ("note", models.CharField(blank=True, max_length=240)),
                ("status", models.CharField(choices=[("proposed", "Proposed"), ("accepted", "Accepted"), ("declined", "Declined"), ("superseded", "Superseded")], default="proposed", max_length=20)),
                ("responded_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("booking", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="schedule_proposals", to="marketplace.bookingrequest")),
                ("proposer", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="schedule_proposals", to="profiles.profile")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="BookingAudit",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("event", models.CharField(max_length=80)),
                ("from_status", models.CharField(blank=True, max_length=24)),
                ("to_status", models.CharField(blank=True, max_length=24)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="booking_audit_events", to="profiles.profile")),
                ("booking", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="audit_events", to="marketplace.bookingrequest")),
            ],
            options={"ordering": ["created_at"]},
        ),
        migrations.AddIndex(model_name="messagethread", index=models.Index(fields=["client", "status"], name="mkt_thread_client_idx")),
        migrations.AddIndex(model_name="messagethread", index=models.Index(fields=["professional", "status"], name="mkt_thread_prof_idx")),
        migrations.AddIndex(model_name="message", index=models.Index(fields=["thread", "created_at"], name="mkt_msg_thread_time_idx")),
        migrations.AddIndex(model_name="message", index=models.Index(fields=["thread", "is_read"], name="mkt_msg_read_idx")),
        migrations.AddIndex(model_name="bookingrequest", index=models.Index(fields=["professional", "status"], name="mkt_book_prof_status_idx")),
    ]
