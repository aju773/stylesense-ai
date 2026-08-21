# 10 — Checkout Flow & Order History

**What to build:** Users can place an order from their cart (mocked payment), decrementing database stock safely using transaction locks. Users can view past order statuses in the Order History page.

**Blocked by:** 08 — Shopping Cart

**Status:** ready-for-agent

- [ ] Order creation API with `select_for_update()` DB lock for stock
- [ ] Mock checkout flow
- [ ] Order History UI Page
