import requests
from django.conf import settings


TOKEN_URL = (
    "https://services.sentinel-hub.com/"
    "auth/realms/main/protocol/openid-connect/token"
)


def get_access_token() -> str:
    response = requests.post(
        TOKEN_URL,
        data={
            "grant_type": "client_credentials",
            "client_id": settings.SENTINEL_HUB_CLIENT_ID,
            "client_secret": settings.SENTINEL_HUB_CLIENT_SECRET,
        },
        timeout=30,
    )

    response.raise_for_status()

    data = response.json()

    return data["access_token"]