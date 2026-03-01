from django.db import migrations, models


def migrate_system_branding(apps, schema_editor):
    SystemConfig = apps.get_model("users", "SystemConfig")

    name_map = {
        "科晟智慧": "宇艺（UniMind.ai）",
        "知行网校": "宇艺（UniMind.ai）",
    }
    short_name_map = {
        "科晟": "宇艺",
        "知行": "宇艺",
    }
    desc_map = {
        "KORSON ACADEMY": "UNIMIND.AI",
        "Knowledge In Action": "UNIMIND.AI",
    }
    invite_map = {
        "KORSON2025": "UNIMIND2026",
    }

    for config in SystemConfig.objects.all():
        changed = False

        next_name = name_map.get(config.school_name)
        if next_name:
            config.school_name = next_name
            changed = True

        next_short_name = short_name_map.get(config.school_short_name)
        if next_short_name:
            config.school_short_name = next_short_name
            changed = True

        next_desc = desc_map.get(config.school_description)
        if next_desc:
            config.school_description = next_desc
            changed = True

        next_invite = invite_map.get(config.invite_code)
        if next_invite:
            config.invite_code = next_invite
            changed = True

        if changed:
            config.save()


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0013_remove_user_avatar_options_remove_user_avatar_url_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="systemconfig",
            name="school_name",
            field=models.CharField(default="宇艺（UniMind.ai）", max_length=100),
        ),
        migrations.AlterField(
            model_name="systemconfig",
            name="school_short_name",
            field=models.CharField(default="宇艺", max_length=20, verbose_name="网校缩写"),
        ),
        migrations.AlterField(
            model_name="systemconfig",
            name="school_description",
            field=models.TextField(default="UNIMIND.AI"),
        ),
        migrations.AlterField(
            model_name="systemconfig",
            name="invite_code",
            field=models.CharField(default="UNIMIND2026", max_length=50, verbose_name="邀请码"),
        ),
        migrations.RunPython(migrate_system_branding, reverse_code=migrations.RunPython.noop),
    ]
