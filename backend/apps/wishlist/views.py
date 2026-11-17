from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import WishlistItem
from .serializers import ToggleWishlistSerializer, WishlistItemSerializer
from .services import wishlist_service
from .services.exceptions import WishlistError


class WishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = wishlist_service.get_items(request.user)
        return Response(WishlistItemSerializer(items, many=True).data)


class WishlistToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Save or unsave a product — the server reports which one happened.

        Unlike the cart, this returns only the touched row rather than the whole
        list. The cart returns everything because the server owns the money and
        the client must never recompute it; a wishlist has nothing computed to
        get wrong, so shipping every saved product back on each heart-click
        would be bytes spent to tell the client what it already holds.
        """
        serializer = ToggleWishlistSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = serializer.validated_data["product_id"]

        try:
            saved, item = wishlist_service.toggle(
                user=request.user,
                product_id=product_id,
                source=serializer.validated_data["source"],
            )
        except WishlistError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "saved": saved,
                "product_id": product_id,
                "item": WishlistItemSerializer(item).data if item else None,
            },
            status=status.HTTP_201_CREATED if saved else status.HTTP_200_OK,
        )


class WishlistItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        """Unsave a known row.

        Kept alongside the toggle rather than folded into it: on the wishlist
        page the heart only ever removes, and routing that through a toggle
        would turn an impatient double-click into remove-then-save-again.
        """
        try:
            wishlist_service.remove_item(user=request.user, item_id=item_id)
        except WishlistItem.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
