from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Farm


User = get_user_model()


class FarmAPITests(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(
            username="farmer1",
            email="farmer1@test.com",
            password="Farmer123!",
            phone="03001234567",
            cnic="1234512345671",
        )

        self.user2 = User.objects.create_user(
            username="farmer2",
            email="farmer2@test.com",
            password="Farmer456!",
            phone="03009876543",
            cnic="9876598765432",
        )

        self.valid_boundary = {
            "type": "Polygon",
            "coordinates": [
                [
                    [73.0479, 33.6844],
                    [73.0489, 33.6844],
                    [73.0489, 33.6854],
                    [73.0479, 33.6854],
                    [73.0479, 33.6844],
                ]
            ],
        }

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_unauthenticated_user_cannot_access_farms(self):
        response = self.client.get("/api/farms/")

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_authenticated_user_can_create_farm(self):
        self.authenticate(self.user1)

        response = self.client.post(
            "/api/farms/",
            {
                "name": "Test Farm",
                "location": "Islamabad",
                "boundary": self.valid_boundary,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            response.data["owner"],
            self.user1.id,
        )

        self.assertEqual(
            Farm.objects.count(),
            1,
        )

    def test_user_can_only_see_own_farms(self):
        farm1 = Farm.objects.create(
            owner=self.user1,
            name="Farmer 1 Farm",
            location="Islamabad",
            boundary=self.valid_boundary,
        )

        Farm.objects.create(
            owner=self.user2,
            name="Farmer 2 Farm",
            location="Taxila",
            boundary=self.valid_boundary,
        )

        self.authenticate(self.user1)

        response = self.client.get("/api/farms/")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

        self.assertEqual(
            response.data[0]["id"],
            farm1.id,
        )

    def test_user_cannot_access_another_users_farm(self):
        farm = Farm.objects.create(
            owner=self.user1,
            name="Farmer 1 Farm",
            location="Islamabad",
            boundary=self.valid_boundary,
        )

        self.authenticate(self.user2)

        response = self.client.get(
            f"/api/farms/{farm.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_user_can_update_own_farm(self):
        farm = Farm.objects.create(
            owner=self.user1,
            name="Old Farm Name",
            location="Islamabad",
            boundary=self.valid_boundary,
        )

        self.authenticate(self.user1)

        response = self.client.patch(
            f"/api/farms/{farm.id}/",
            {
                "name": "Updated Farm Name",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        farm.refresh_from_db()

        self.assertEqual(
            farm.name,
            "Updated Farm Name",
        )

    def test_user_cannot_update_another_users_farm(self):
        farm = Farm.objects.create(
            owner=self.user1,
            name="Farmer 1 Farm",
            location="Islamabad",
            boundary=self.valid_boundary,
        )

        self.authenticate(self.user2)

        response = self.client.patch(
            f"/api/farms/{farm.id}/",
            {
                "name": "Hacked Farm",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_user_can_delete_own_farm(self):
        farm = Farm.objects.create(
            owner=self.user1,
            name="Farm To Delete",
            location="Islamabad",
            boundary=self.valid_boundary,
        )

        self.authenticate(self.user1)

        response = self.client.delete(
            f"/api/farms/{farm.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Farm.objects.filter(id=farm.id).exists()
        )

    def test_user_cannot_delete_another_users_farm(self):
        farm = Farm.objects.create(
            owner=self.user1,
            name="Protected Farm",
            location="Islamabad",
            boundary=self.valid_boundary,
        )

        self.authenticate(self.user2)

        response = self.client.delete(
            f"/api/farms/{farm.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.assertTrue(
            Farm.objects.filter(id=farm.id).exists()
        )

    def test_valid_polygon_is_accepted(self):
        self.authenticate(self.user1)

        response = self.client.post(
            "/api/farms/",
            {
                "name": "Valid Polygon Farm",
                "location": "Islamabad",
                "boundary": self.valid_boundary,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_invalid_polygon_type_is_rejected(self):
        self.authenticate(self.user1)

        invalid_boundary = {
            "type": "Point",
            "coordinates": [73.0479, 33.6844],
        }

        response = self.client.post(
            "/api/farms/",
            {
                "name": "Invalid Polygon Farm",
                "location": "Islamabad",
                "boundary": invalid_boundary,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_unclosed_polygon_is_rejected(self):
        self.authenticate(self.user1)

        invalid_boundary = {
            "type": "Polygon",
            "coordinates": [
                [
                    [73.0479, 33.6844],
                    [73.0489, 33.6844],
                    [73.0489, 33.6854],
                    [73.0479, 33.6854],
                ]
            ],
        }

        response = self.client.post(
            "/api/farms/",
            {
                "name": "Unclosed Polygon Farm",
                "location": "Islamabad",
                "boundary": invalid_boundary,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )