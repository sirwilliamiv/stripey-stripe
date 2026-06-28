# Stripe Testing Guide — Inbox Admin

## Test Mode

Your Stripe dashboard has a Test/Live toggle in the top right. All your `sk_test_` and `pk_test_` keys only work in test mode — no real charges ever happen.

## Test Card Numbers

| Card | Number | Use |
|------|--------|-----|
| Visa (success) | 4242 4242 4242 4242 | Always succeeds |
| Visa (decline) | 4000 0000 0000 0002 | Always declines |
| Requires auth | 4000 0025 0000 3155 | Triggers 3D Secure |
| Insufficient funds | 4000 0000 0000 9995 | Decline: insufficient funds |

For all test cards:
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

## Test Webhooks

You're already using webhook signature verification. To test locally:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to your local API
stripe listen --forward-to localhost:8080/webhooks/stripe

# This prints a webhook signing secret (whsec_...) — use it as STRIPE_WEBHOOK_SECRET locally
```

Then trigger events manually:
```bash
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted
```

## Test Checkout Flow

Your app already creates Stripe Checkout sessions. In test mode, use the 4242 card on the Stripe-hosted checkout page. The webhook fires back to your `/webhooks/stripe` endpoint with the test event.

## Test Clock (for subscriptions)

Stripe has "Test Clocks" in the dashboard to simulate time passing — useful for testing trial expiration, billing cycles, and payment failures without waiting 30 days.

## Current Setup

All of this works with your existing `STRIPE_SECRET_KEY` as long as it starts with `sk_test_`. Your current deploy already uses test keys based on what I saw in the Secret Manager setup.
