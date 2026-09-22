from django.conf import settings
from django.db import models


class Farm(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="farms",
    )

    name = models.CharField(max_length=150)

    location = models.CharField(
        max_length=255,
        blank=True,
    )

    boundary = models.JSONField(
        blank=True,
        null=True,
        help_text="Farm boundary as a GeoJSON Polygon.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name