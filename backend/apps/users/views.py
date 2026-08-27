from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from .cookie_utils import clear_token_cookies, set_token_cookies
from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        response = Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )
        set_token_cookies(response, refresh.access_token, refresh)
        return response


class LoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get("email", "")
        password = request.data.get("password", "")

        user = User.objects.filter(email=email).first()
        if user is None or not user.check_password(password):
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_active:
            return Response(
                {"detail": "Account disabled."},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        response = Response(UserSerializer(user).data)
        set_token_cookies(response, refresh.access_token, refresh)
        return response


class LogoutView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass

        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_token_cookies(response)
        return response


class TokenRefreshView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            return Response(
                {"detail": "No refresh token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            old_refresh = RefreshToken(refresh_token)
            # Rotation: get new access token, old refresh gets blacklisted
            # (because ROTATE_REFRESH_TOKENS and BLACKLIST_AFTER_ROTATION are True)
            new_access = old_refresh.access_token
            response = Response({"detail": "Token refreshed."})
            set_token_cookies(response, new_access, old_refresh)
            return response
        except TokenError:
            response = Response(
                {"detail": "Invalid or expired refresh token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            clear_token_cookies(response)
            return response


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        # Ownership is enforced by construction: this always resolves to the
        # requesting user, never to an id supplied by the client.
        return self.request.user
