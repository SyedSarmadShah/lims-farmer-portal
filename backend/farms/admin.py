from django.contrib import admin

from .models import Farm


@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "owner",
        "location",
        "created_at",
        "updated_at",
    )

    list_filter = (
        "created_at",
        "updated_at",
    )

    search_fields = (
        "name",
        "owner__username",
        "owner__email",
        "owner__cnic",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )