import { NextResponse } from "next/server";
import Stripe from "stripe";
import stripe from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

// Must disable body parsing so we can verify the raw signature
export const runtime = "nodejs";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing stripe-signature or STRIPE_WEBHOOK_SECRET" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    console.error("[webhook] signature verification failed:", err);
    const message = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      // ── Checkout completed ──────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        if (session.mode === "subscription") {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await upsertSubscription(supabase, userId, sub);
        } else if (session.mode === "payment") {
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null;

          if (paymentIntentId) {
            const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
            await insertPayment(supabase, userId, pi, session.id);
          }
        }
        break;
      }

      // ── Subscription updated ────────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await getUserIdFromCustomer(
          supabase,
          sub.customer as string
        );
        if (userId) await upsertSubscription(supabase, userId, sub);
        break;
      }

      // ── Subscription deleted/cancelled ──────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id);

        if (error) console.error("[webhook] subscription delete update:", error);
        break;
      }

      // ── Invoice paid (subscription renewal) ────────────────
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        // In Stripe API 2026-04-22.dahlia, subscription is accessed via parent.subscription_details
        const subDetails = invoice.parent?.subscription_details;
        if (!subDetails) break;

        const rawSub = subDetails.subscription;
        const subId = typeof rawSub === "string" ? rawSub : rawSub?.id ?? null;

        if (!subId) break;

        const sub = await stripe.subscriptions.retrieve(subId);
        const userId = await getUserIdFromCustomer(
          supabase,
          sub.customer as string
        );
        if (userId) await upsertSubscription(supabase, userId, sub);
        break;
      }

      default:
        // Unhandled event — return 200 so Stripe doesn't retry
        break;
    }
  } catch (err) {
    console.error("[webhook] handler error:", err);
    return NextResponse.json(
      { error: "Internal handler error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

// ─── helpers ────────────────────────────────────────────────

type SupabaseServiceClient = ReturnType<typeof createServiceClient>;

async function upsertSubscription(
  supabase: SupabaseServiceClient,
  userId: string,
  sub: Stripe.Subscription
) {
  // In v22, current_period_end lives on each item, not the subscription root
  const item = sub.items.data[0];
  const periodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000).toISOString()
    : null;

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: sub.id,
      stripe_customer_id:
        typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      price_id: item?.price?.id ?? null,
      status: sub.status,
      current_period_end: periodEnd,
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );

  if (error) console.error("[webhook] upsertSubscription:", error);
}

async function insertPayment(
  supabase: SupabaseServiceClient,
  userId: string,
  pi: Stripe.PaymentIntent,
  checkoutSessionId: string
) {
  const { error } = await supabase.from("payments").upsert(
    {
      user_id: userId,
      stripe_payment_intent_id: pi.id,
      stripe_checkout_session_id: checkoutSessionId,
      amount_cents: pi.amount,
      currency: pi.currency,
      status: pi.status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_payment_intent_id" }
  );

  if (error) console.error("[webhook] insertPayment:", error);
}

async function getUserIdFromCustomer(
  supabase: SupabaseServiceClient,
  customerId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  return data?.id ?? null;
}
