from django.urls import path

from .views import FarmSatelliteImageView


urlpatterns = [
    path(
        "farms/<int:farm_id>/image/",
        FarmSatelliteImageView.as_view(),
        name="farm-satellite-image",
    ),
]