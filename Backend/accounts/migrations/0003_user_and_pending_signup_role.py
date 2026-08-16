from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0002_pendingsignup")]

    operations = [
        migrations.AddField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[("client", "Client"), ("professional", "Professional")],
                default="client",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="pendingsignup",
            name="role",
            field=models.CharField(
                choices=[("client", "Client"), ("professional", "Professional")],
                default="client",
                max_length=20,
            ),
        ),
    ]
