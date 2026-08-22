from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order
from .serializers import OrderSerializer, PlaceOrderSerializer
from .services import order_service
from .services.exceptions import EmptyCart, PaymentFailed, StockConflict


class OrderListView(APIView):
    permission_classes = [IsAuthenticated]
    # Placement takes row locks on real inventory and talks to a gateway. A
    # client that can fire it in a loop can hold locks on the catalog.
    throttle_scope = "orders"

    def get(self, request):
        orders = order_service.get_orders(user=request.user)
        return Response(OrderSerializer(orders, many=True).data)

    def post(self, request):
        serializer = PlaceOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = order_service.place_order(
                user=request.user,
                payment_token=serializer.validated_data["payment_token"],
            )
        except EmptyCart as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except StockConflict as exc:
            # 409, not 400: the request was well-formed and was valid when the
            # customer sent it. The world moved.
            return Response(
                {"detail": str(exc), "lines": exc.lines},
                status=status.HTTP_409_CONFLICT,
            )
        except PaymentFailed as exc:
            return Response(
                {"detail": str(exc), "code": exc.code},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        try:
            order = order_service.get_owned_order(user=request.user, order_id=order_id)
        except Order.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order).data)
