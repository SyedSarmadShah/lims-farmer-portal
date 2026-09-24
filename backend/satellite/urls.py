from django.urls import path
from .views import FarmNDVIView, FarmSatelliteImageView,FarmNDVIStatisticsView

urlpatterns = [
    path(
        "farms/<int:farm_id>/image/",
        FarmSatelliteImageView.as_view(),
        name="farm-satellite-image",
    ),
    path(
        "farms/<int:farm_id>/ndvi/",
        FarmNDVIView.as_view(),
        name="farm-ndvi",
    ),
    path(
    "farms/<int:farm_id>/ndvi/stats/",
    FarmNDVIStatisticsView.as_view(),
    name="farm-ndvi-statistics",
    ),
]