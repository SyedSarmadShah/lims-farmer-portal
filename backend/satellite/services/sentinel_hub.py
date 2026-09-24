import requests
from django.conf import settings


TOKEN_URL = (
    "https://services.sentinel-hub.com/"
    "auth/realms/main/protocol/openid-connect/token"
)

PROCESS_URL = "https://services.sentinel-hub.com/api/v1/process"


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

    return response.json()["access_token"]


def get_true_color_image(
    geometry: dict,
    start_date: str,
    end_date: str,
) -> bytes:
    access_token = get_access_token()

    evalscript = """
//VERSION=3

function setup() {
    return {
        input: ["B02", "B03", "B04"],
        output: {
            bands: 3,
            sampleType: "AUTO"
        }
    };
}

function evaluatePixel(sample) {
    return [
        2.5 * sample.B04,
        2.5 * sample.B03,
        2.5 * sample.B02
    ];
}
"""
def get_ndvi_image(
    geometry: dict,
    start_date: str,
    end_date: str,
) -> bytes:
    access_token = get_access_token()

    evalscript = """
//VERSION=3

function setup() {
    return {
        input: ["B04", "B08"],
        output: {
            bands: 3,
            sampleType: "AUTO"
        }
    };
}

function evaluatePixel(sample) {
    let ndvi = (sample.B08 - sample.B04) /
               (sample.B08 + sample.B04);

    if (ndvi < 0.1) {
        return [0.5, 0.5, 0.5];
    }

    if (ndvi < 0.3) {
        return [1, 1, 0];
    }

    if (ndvi < 0.5) {
        return [0.6, 1, 0];
    }

    return [0, 0.6, 0];
}
"""
def get_ndvi_image(
    geometry: dict,
    start_date: str,
    end_date: str,
) -> bytes:
    access_token = get_access_token()

    evalscript = """
//VERSION=3

function setup() {
    return {
        input: ["B04", "B08"],
        output: {
            bands: 3,
            sampleType: "AUTO"
        }
    };
}

function evaluatePixel(sample) {
    let ndvi = (sample.B08 - sample.B04) /
               (sample.B08 + sample.B04);

    if (ndvi < 0.1) {
        return [0.5, 0.5, 0.5];
    }

    if (ndvi < 0.3) {
        return [1, 1, 0];
    }

    if (ndvi < 0.5) {
        return [0.6, 1, 0];
    }

    return [0, 0.6, 0];
}
"""

    payload = {
        "input": {
            "bounds": {
                "properties": {
                    "crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
                },
                "geometry": geometry,
            },
            "data": [
                {
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {
                            "from": f"{start_date}T00:00:00Z",
                            "to": f"{end_date}T23:59:59Z",
                        },
                        "maxCloudCoverage": 30,
                    },
                }
            ],
        },
        "output": {
            "width": 512,
            "height": 512,
            "responses": [
                {
                    "identifier": "default",
                    "format": {
                        "type": "image/png",
                    },
                }
            ],
        },
        "evalscript": evalscript,
    }

    response = requests.post(
        PROCESS_URL,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=120,
    )

    response.raise_for_status()

    return response.content

    payload = {
        "input": {
            "bounds": {
                "properties": {
                    "crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
                },
                "geometry": geometry,
            },
            "data": [
                {
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {
                            "from": f"{start_date}T00:00:00Z",
                            "to": f"{end_date}T23:59:59Z",
                        },
                        "maxCloudCoverage": 30,
                    },
                }
            ],
        },
        "output": {
            "width": 512,
            "height": 512,
            "responses": [
                {
                    "identifier": "default",
                    "format": {
                        "type": "image/png",
                    },
                }
            ],
        },
        "evalscript": evalscript,
    }

    response = requests.post(
        PROCESS_URL,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=120,
    )

    response.raise_for_status()

    return response.content
    payload = {
        "input": {
            "bounds": {
                "properties": {
                    "crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
                },
                "geometry": geometry,
            },
            "data": [
                {
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {
                            "from": f"{start_date}T00:00:00Z",
                            "to": f"{end_date}T23:59:59Z",
                        },
                        "maxCloudCoverage": 30,
                    },
                }
            ],
        },
        "output": {
            "width": 512,
            "height": 512,
            "responses": [
                {
                    "identifier": "default",
                    "format": {
                        "type": "image/png",
                    },
                }
            ],
        },
        "evalscript": evalscript,
    }

    response = requests.post(
        PROCESS_URL,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=120,
    )

    response.raise_for_status()

    return response.content

STATISTICS_URL = "https://services.sentinel-hub.com/api/v1/statistics"


def get_ndvi_statistics(
    geometry: dict,
    start_date: str,
    end_date: str,
) -> dict:
    access_token = get_access_token()

    evalscript = """
//VERSION=3

function setup() {
    return {
        input: [
            {
                bands: ["B04", "B08", "dataMask"]
            }
        ],
        output: [
            {
                id: "ndvi",
                bands: 1,
                sampleType: "FLOAT32"
            },
            {
                id: "dataMask",
                bands: 1
            }
        ]
    };
}

function evaluatePixel(sample) {
    let ndvi = (sample.B08 - sample.B04) /
               (sample.B08 + sample.B04);

    return {
        ndvi: [ndvi],
        dataMask: [sample.dataMask]
    };
}
"""

    payload = {
        "input": {
            "bounds": {
                "properties": {
                    "crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
                },
                "geometry": geometry,
            },
            "data": [
                {
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {
                            "from": f"{start_date}T00:00:00Z",
                            "to": f"{end_date}T23:59:59Z",
                        },
                        "maxCloudCoverage": 30,
                    },
                }
            ],
        },
        "aggregation": {
            "timeRange": {
                "from": f"{start_date}T00:00:00Z",
                "to": f"{end_date}T23:59:59Z",
            },
            "aggregationInterval": {
                "of": "P30D"
            },
            "evalscript": evalscript,
            "resx": 0.0001,
            "resy": 0.0001,
        },
    }

    response = requests.post(
        STATISTICS_URL,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        json=payload,
        timeout=120,
    )

    if not response.ok:
        raise requests.HTTPError(
            f"Sentinel Hub statistics request failed ({response.status_code}): "
            f"{response.text}",
            response=response,
        )

    return response.json()