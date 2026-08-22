from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CartItem
from .serializers import (
    AddCartItemSerializer,
    CartItemSerializer,
    CartSerializer,
    UpdateCartItemSerializer,
)
from .services import cart_service
from .services.exceptions import CartError


def cart_payload(user) -> dict:
    """The full bag, freshly totalled.

    Every mutating endpoint returns this rather than just the row it touched, so
    the client can replace its cart state wholesale and never has to recompute
    money locally.
    """
    cart = cart_service.get_or_create_cart(user)
    items = list(cart_service.get_cart_items(cart))
    return CartSerializer(
        {"items": items, "totals": cart_service.calculate_totals(items)}
    ).data


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(cart_payload(request.user))

    def delete(self, request):
        """Empty the bag."""
        cart_service.clear_cart(user=request.user)
        return Response(cart_payload(request.user))


class CartItemListView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            item = cart_service.add_item(user=request.user, **serializer.validated_data)
        except CartError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {"item": CartItemSerializer(item).data, "cart": cart_payload(request.user)},
            status=status.HTTP_201_CREATED,
        )


class CartItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, item_id):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            item = cart_service.update_item_quantity(
                user=request.user,
                item_id=item_id,
                quantity=serializer.validated_data["quantity"],
            )
        except CartItem.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        except CartError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {"item": CartItemSerializer(item).data, "cart": cart_payload(request.user)}
        )

    def delete(self, request, item_id):
        try:
            cart_service.remove_item(user=request.user, item_id=item_id)
        except CartItem.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(cart_payload(request.user))
