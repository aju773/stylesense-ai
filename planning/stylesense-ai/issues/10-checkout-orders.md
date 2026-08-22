# 10 — Checkout Flow & Order History

**What to build:** Users can place an order from their cart (mocked payment), decrementing database stock safely using transaction locks. Users can view past order statuses in the Order History page.

**Blocked by:** 08 — Shopping Cart

**Status:** done

- [x] Order creation API with `select_for_update()` DB lock for stock
- [x] Mock checkout flow
- [x] Order History UI Page

## Slices

- [10.1 — Order Models](10.1-order-models.md)
- [10.2 — Order Placement Service, Mock Gateway, and Orders API](10.2-order-api-stock-locking.md)
- [10.3 — Checkout Flow UI](10.3-checkout-flow-ui.md)
- [10.4 — Order History Page](10.4-order-history-page.md)

