from django.contrib.auth.models import Group, Permission


ROLE_PERMISSIONS = {
    "Operations Admin": [
        ("operations", "view_operations_dashboard"),
        ("operations", "manage_support"),
        ("operations", "manage_platform_config"),
        ("operations", "manage_operational_roles"),
        ("operations", "view_supportcase"),
        ("operations", "change_supportcase"),
        ("operations", "view_platformconfiguration"),
        ("operations", "change_platformconfiguration"),
        ("operations", "add_platformconfiguration"),
        ("operations", "view_operationsaudit"),
        ("accounts", "view_user"),
        ("accounts", "change_user"),
        ("profiles", "view_profile"),
        ("posts", "view_post"),
        ("posts", "view_postreport"),
        ("posts", "change_postreport"),
        ("posts", "view_moderationaudit"),
        ("marketplace", "view_conversationreport"),
        ("marketplace", "change_conversationreport"),
        ("marketplace", "view_bookingrequest"),
        ("marketplace", "view_bookingaudit"),
        ("verification", "view_verificationsubmission"),
        ("verification", "review_verification"),
        ("verification", "view_verificationaudit"),
        ("sabipay", "view_transaction"),
        ("sabipay", "view_dispute"),
        ("sabipay", "manage_sabipay"),
        ("notifications", "view_notification"),
    ],
    "Verification Reviewer": [
        ("operations", "view_operations_dashboard"),
        ("verification", "view_verificationsubmission"),
        ("verification", "change_verificationsubmission"),
        ("verification", "review_verification"),
        ("verification", "view_verificationdocument"),
        ("verification", "view_verificationaudit"),
        ("accounts", "view_user"),
        ("profiles", "view_profile"),
    ],
    "Moderator": [
        ("operations", "view_operations_dashboard"),
        ("posts", "view_post"),
        ("posts", "view_postreport"),
        ("posts", "change_postreport"),
        ("posts", "view_moderationaudit"),
        ("marketplace", "view_conversationreport"),
        ("marketplace", "change_conversationreport"),
        ("accounts", "view_user"),
        ("profiles", "view_profile"),
    ],
    "Support Agent": [
        ("operations", "view_operations_dashboard"),
        ("operations", "manage_support"),
        ("operations", "view_supportcase"),
        ("operations", "change_supportcase"),
        ("operations", "view_operationsaudit"),
        ("accounts", "view_user"),
        ("profiles", "view_profile"),
        ("posts", "view_postreport"),
        ("marketplace", "view_conversationreport"),
        ("marketplace", "view_bookingrequest"),
        ("verification", "view_verificationsubmission"),
        ("sabipay", "view_transaction"),
        ("sabipay", "view_dispute"),
    ],
    "Finance Admin": [
        ("operations", "view_operations_dashboard"),
        ("operations", "view_operationsaudit"),
        ("sabipay", "view_transaction"),
        ("sabipay", "view_paymentattempt"),
        ("sabipay", "view_payoutrecord"),
        ("sabipay", "view_payoutdestination"),
        ("sabipay", "view_dispute"),
        ("sabipay", "manage_sabipay"),
        ("marketplace", "view_bookingrequest"),
        ("accounts", "view_user"),
        ("profiles", "view_profile"),
    ],
    "Read-only Analyst": [
        ("operations", "view_operations_dashboard"),
        ("operations", "view_supportcase"),
        ("accounts", "view_user"),
        ("profiles", "view_profile"),
        ("posts", "view_post"),
        ("posts", "view_postreport"),
        ("marketplace", "view_servicelisting"),
        ("marketplace", "view_jobposting"),
        ("marketplace", "view_bookingrequest"),
        ("verification", "view_verificationsubmission"),
        ("sabipay", "view_transaction"),
        ("sabipay", "view_dispute"),
        ("notifications", "view_notification"),
    ],
}


def sync_operational_roles():
    synced = {}
    for role_name, permission_keys in ROLE_PERMISSIONS.items():
        group, _ = Group.objects.get_or_create(name=role_name)
        permissions = []
        for app_label, codename in permission_keys:
            permission = Permission.objects.filter(content_type__app_label=app_label, codename=codename).first()
            if permission:
                permissions.append(permission)
        group.permissions.set(permissions)
        synced[role_name] = len(permissions)
    return synced
