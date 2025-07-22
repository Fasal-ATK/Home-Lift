from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.conf import settings
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import CustomUser
from django.contrib.auth import login, logout
import logging
from rest_framework.exceptions import ValidationError
