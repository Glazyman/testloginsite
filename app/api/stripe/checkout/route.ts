import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase/server";

// POST /api/stripe/checkout
// Body: { planType: "monthly" | "onetime" | "custom-monthly" | "custom-onetime", amount?: number }
export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { planType, amount } = body as {
      planType: "monthly" | "onetime" | "custom-monthly" | "custom-onetime";
      amount?: number;
    };

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    // Resolve or create the Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId: string | undefined = profile?.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Persist the customer id in the profile
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    let sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0];

    switch (planType) {
      case "monthly": {
        const priceId = process.env.STRIPE_PRICE_MONTHLY_ID;
        if (!priceId)
          return NextResponse.json(
            { error: "STRIPE_PRICE_MONTHLY_ID not set" },
            { status: 500 }
          );

        sessionParams = {
          customer: customerId,
          mode: "subscription",
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${siteUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=1`,
          cancel_url: `${siteUrl}/pricing?canceled=1`,
          metadata: { supabase_user_id: user.id },
        };
        break;
      }

      case "onetime": {
        const priceId = process.env.STRIPE_PRICE_ONE_TIME_ID;
        if (!priceId)
          return NextResponse.json(
            { error: "STRIPE_PRICE_ONE_TIME_ID not set" },
            { status: 500 }
          );

        sessionParams = {
          customer: customerId,
          mode: "payment",
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${siteUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=1`,
          cancel_url: `${siteUrl}/pricing?canceled=1`,
          metadata: { supabase_user_id: user.id },
        };
        break;
      }

      case "custom-monthly": {
        if (!amount || amount < 1)
          return NextResponse.json(
            { error: "Amount must be at least $1" },
            { status: 400 }
          );

        sessionParams = {
          customer: customerId,
          mode: "subscription",
          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: Math.round(amount * 100),
                recurring: { interval: "month" },
                product_data: { name: `Custom Monthly — $${amount}/mo` },
              },
              quantity: 1,
            },
          ],
          success_url: `${siteUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=1`,
          cancel_url: `${siteUrl}/pricing?canceled=1`,
          metadata: { supabase_user_id: user.id },
        };
        break;
      }

      case "custom-onetime": {
        if (!amount || amount < 1)
          return NextResponse.json(
            { error: "Amount must be at least $1" },
            { status: 400 }
          );

        sessionParams = {
          customer: customerId,
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: Math.round(amount * 100),
                product_data: { name: `Custom Payment — $${amount}` },
              },
              quantity: 1,
            },
          ],
          success_url: `${siteUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=1`,
          cancel_url: `${siteUrl}/pricing?canceled=1`,
          metadata: { supabase_user_id: user.id },
        };
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid planType" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("[stripe/checkout] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
