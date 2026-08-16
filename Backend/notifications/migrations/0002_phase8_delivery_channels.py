from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    dependencies = [("notifications", "0001_initial"), ("profiles", "0004_profile_address")]

    operations = [
        migrations.AlterField(
            model_name="notification",
            name="actor",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="actor_notifications", to="profiles.profile"),
        ),
        migrations.AlterField(
            model_name="notification",
            name="type",
            field=models.CharField(choices=[("follow", "Follow"), ("like", "Like"), ("comment", "Comment"), ("reply", "Reply"), ("post", "Post"), ("message", "Message"), ("booking", "Booking"), ("verification", "Verification"), ("payment", "Payment"), ("dispute", "Dispute"), ("review", "Review"), ("support", "Support")], max_length=24),
        ),
        migrations.AlterField(
            model_name="notification",
            name="target_content_type",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="contenttypes.contenttype"),
        ),
        migrations.AddField(model_name="notification", name="deep_link", field=models.CharField(blank=True, max_length=500)),
        migrations.AddField(model_name="notification", name="metadata", field=models.JSONField(blank=True, default=dict)),
        migrations.AddField(model_name="notification", name="event_key", field=models.CharField(blank=True, max_length=180, null=True, unique=True)),
        migrations.AddIndex(model_name="notification", index=models.Index(fields=["user", "is_read", "created_at"], name="notif_user_read_time_idx")),
        migrations.AddIndex(model_name="notification", index=models.Index(fields=["type", "created_at"], name="notif_type_time_idx")),
        migrations.CreateModel(
            name="NotificationPreference",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("push_enabled", models.BooleanField(default=True)),
                ("email_enabled", models.BooleanField(default=True)),
                ("payment_email_enabled", models.BooleanField(default=True)),
                ("dispute_email_enabled", models.BooleanField(default=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("profile", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="notification_preferences", to="profiles.profile")),
            ],
        ),
        migrations.CreateModel(
            name="PushDevice",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("token", models.CharField(max_length=255, unique=True)),
                ("platform", models.CharField(choices=[("ios", "iOS"), ("android", "Android"), ("web", "Web")], max_length=16)),
                ("device_name", models.CharField(blank=True, max_length=120)),
                ("is_active", models.BooleanField(default=True)),
                ("last_seen_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("profile", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="push_devices", to="profiles.profile")),
            ],
            options={"ordering": ["-last_seen_at"]},
        ),
        migrations.AddIndex(model_name="pushdevice", index=models.Index(fields=["profile", "is_active"], name="notif_device_active_idx")),
        migrations.CreateModel(
            name="NotificationDelivery",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("channel", models.CharField(choices=[("in_app", "In app"), ("push", "Push"), ("email", "Email")], max_length=16)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("sent", "Sent"), ("skipped", "Skipped"), ("failed", "Failed")], default="pending", max_length=16)),
                ("provider_reference", models.CharField(blank=True, max_length=180)),
                ("error", models.TextField(blank=True)),
                ("attempted_at", models.DateTimeField(blank=True, null=True)),
                ("sent_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("notification", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="deliveries", to="notifications.notification")),
            ],
            options={"ordering": ["created_at"]},
        ),
        migrations.AddConstraint(model_name="notificationdelivery", constraint=models.UniqueConstraint(fields=("notification", "channel"), name="notif_delivery_channel_uniq")),
    ]
