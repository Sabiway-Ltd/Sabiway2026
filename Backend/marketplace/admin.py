from django.contrib import admin

from .models import BookingRequest, JobPosting, JobResponse, ServiceCategory, ServiceListing, ServiceSubcategory


class ServiceSubcategoryInline(admin.TabularInline):
    model = ServiceSubcategory
    extra = 0


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "sort_order", "is_active")
    list_filter = ("is_active",)
    list_editable = ("sort_order", "is_active")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ServiceSubcategoryInline]


@admin.register(ServiceSubcategory)
class ServiceSubcategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "is_active")
    list_filter = ("is_active", "category")
    search_fields = ("name", "category__name")


@admin.register(ServiceListing)
class ServiceListingAdmin(admin.ModelAdmin):
    list_display = ("title", "provider", "category", "city", "state", "price_from", "currency", "available_now", "moderation_status", "is_featured", "is_active")
    list_filter = ("moderation_status", "is_featured", "is_active", "available_now", "delivery_mode", "category", "country", "state")
    list_editable = ("moderation_status", "is_featured", "is_active")
    search_fields = ("title", "description", "provider__full_name", "provider__username", "city", "state")
    readonly_fields = ("id", "created_at", "updated_at")


class JobResponseInline(admin.TabularInline):
    model = JobResponse
    extra = 0
    readonly_fields = ("professional", "message", "proposed_price", "currency", "status", "created_at")


@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    list_display = ("title", "client", "category", "city", "state", "status", "moderation_status", "created_at")
    list_filter = ("status", "moderation_status", "delivery_mode", "category", "country", "state")
    list_editable = ("status", "moderation_status")
    search_fields = ("title", "description", "client__full_name", "client__username", "city", "state")
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [JobResponseInline]


@admin.register(JobResponse)
class JobResponseAdmin(admin.ModelAdmin):
    list_display = ("job", "professional", "proposed_price", "currency", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("job__title", "professional__full_name", "message")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(BookingRequest)
class BookingRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "listing", "client", "status", "requested_for", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("listing__title", "client__full_name", "client__username", "message")
    readonly_fields = ("id", "created_at", "updated_at")
