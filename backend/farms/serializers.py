from rest_framework import serializers

from .models import Farm


class FarmSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.id")

    class Meta:
        model = Farm
        fields = [
            "id",
            "name",
            "owner",
            "location",
            "boundary",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "owner",
            "created_at",
            "updated_at",
        ]

    def validate_boundary(self, value):
        if value is None:
            return value

        if not isinstance(value, dict):
            raise serializers.ValidationError(
                "Boundary must be a GeoJSON Polygon object."
            )

        if value.get("type") != "Polygon":
            raise serializers.ValidationError(
                "Boundary type must be 'Polygon'."
            )

        coordinates = value.get("coordinates")

        if not isinstance(coordinates, list) or len(coordinates) != 1:
            raise serializers.ValidationError(
                "Polygon coordinates must contain exactly one linear ring."
            )

        ring = coordinates[0]

        if not isinstance(ring, list) or len(ring) < 4:
            raise serializers.ValidationError(
                "A polygon must contain at least 4 coordinate points."
            )

        if ring[0] != ring[-1]:
            raise serializers.ValidationError(
                "The first and last polygon coordinates must be identical."
            )

        for point in ring:
            if (
                not isinstance(point, list)
                or len(point) != 2
                or not all(isinstance(value, (int, float)) for value in point)
            ):
                raise serializers.ValidationError(
                    "Each coordinate must be [longitude, latitude]."
                )

            longitude, latitude = point

            if not -180 <= longitude <= 180:
                raise serializers.ValidationError(
                    "Longitude must be between -180 and 180."
                )

            if not -90 <= latitude <= 90:
                raise serializers.ValidationError(
                    "Latitude must be between -90 and 90."
                )

        return value