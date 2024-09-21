from django.db import models
from djongo import models as djongo_models

class User(djongo_models.Model):
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    firstName = models.CharField(max_length=50)
    lastName = models.CharField(max_length=50)
    accountType = models.CharField(max_length=20)
    contactNumber = models.CharField(max_length=15, null=True, blank=True)
    approved = models.BooleanField(default=True)
    image = models.URLField(null=True, blank=True)
    reset_password_token = models.UUIDField(null=True, blank=True)
    reset_password_token_expires = models.DateTimeField(null=True, blank=True)

class OTP(djongo_models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    createdAt = models.DateTimeField(auto_now_add=True)

class Profile(djongo_models.Model):
    user = djongo_models.OneToOneField(User, on_delete=models.CASCADE)
    gender = models.CharField(max_length=10, null=True, blank=True)
    dateOfBirth = models.DateField(null=True, blank=True)
    about = models.TextField(null=True, blank=True)