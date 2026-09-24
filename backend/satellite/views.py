from django.http import HttpResponse, JsonResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from farms.models import Farm
from satellite.services.sentinel_hub import (
    get_true_color_image,
    get_ndvi_image,
    get_ndvi_statistics,
)

class FarmSatelliteImageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, farm_id):
        try:
            farm = Farm.objects.get(
                id=farm_id,
                owner=request.user,
            )
        except Farm.DoesNotExist:
            return JsonResponse(
                {"detail": "Farm not found."},
                status=404,
            )

        if not farm.boundary:
            return JsonResponse(
                {"detail": "Farm does not have a boundary."},
                status=400,
            )

        try:
            image = get_true_color_image(
                geometry=farm.boundary,
                start_date="2026-08-01",
                end_date="2026-09-20",
            )

            return HttpResponse(
                image,
                content_type="image/png",
            )

        except Exception as exc:
            return JsonResponse(
                {"detail": str(exc)},
                status=502,
            )
            
class FarmNDVIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, farm_id):
        try:
            farm = Farm.objects.get(
                id=farm_id,
                owner=request.user,
            )
        except Farm.DoesNotExist:
            return JsonResponse(
                {"detail": "Farm not found."},
                status=404,
            )

        if not farm.boundary:
            return JsonResponse(
                {"detail": "Farm does not have a boundary."},
                status=400,
            )

        try:
            image = get_ndvi_image(
                geometry=farm.boundary,
                start_date="2026-08-01",
                end_date="2026-09-20",
            )

            return HttpResponse(
                image,
                content_type="image/png",
            )

        except Exception as exc:
            return JsonResponse(
                {"detail": str(exc)},
                status=502,
            )

class FarmNDVIStatisticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, farm_id):
        try:
            farm = Farm.objects.get(
                id=farm_id,
                owner=request.user,
            )
        except Farm.DoesNotExist:
            return JsonResponse(
                {"detail": "Farm not found."},
                status=404,
            )

        if not farm.boundary:
            return JsonResponse(
                {"detail": "Farm does not have a boundary."},
                status=400,
            )

        try:
            stats = get_ndvi_statistics(
                geometry=farm.boundary,
                start_date="2026-08-01",
                end_date="2026-09-20",
            )

            ndvi_stats = (
                stats["data"][0]
                ["outputs"]["ndvi"]
                ["bands"]["B0"]
                ["stats"]
            )

            return JsonResponse({
                "farm_id": farm.id,
                "average_ndvi": ndvi_stats["mean"],
                "minimum_ndvi": ndvi_stats["min"],
                "maximum_ndvi": ndvi_stats["max"],
            })

        except Exception as exc:
            return JsonResponse(
                {"detail": str(exc)},
                status=502,
            )