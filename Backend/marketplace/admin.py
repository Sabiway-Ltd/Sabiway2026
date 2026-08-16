from django.contrib import admin

from .models import BookingRequest, ServiceCategory, ServiceListing


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(ServiceListing)
class ServiceListingAdmin(admin.ModelAdmin):
    list_display = ("title", "provider", "category", "state", "price_from", "currency", "is_active")
    list_filter = ("is_active", "delivery_mode", "category", "state")
    search_fields = ("title", "description", "provider__full_name", "provider__username")


@admin.register(BookingRequest)
class BookingRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "listing", "client", "status", "requested_for", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("listing__title", "client__full_name", "client__username", "message")
    readonly_fields = ("id", "created_at", "updated_at")
