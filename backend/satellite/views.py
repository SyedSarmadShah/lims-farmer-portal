from django.http import HttpResponse, JsonResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from farms.models import Farm
from satellite.services.sentinel_hub import get_true_color_image


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