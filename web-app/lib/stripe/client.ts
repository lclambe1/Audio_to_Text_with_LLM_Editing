import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export async function createOrRetrieveCustomer(
  userId: string,
  email: string
): Promise<string> {
  const existing = await stripe.customers.search({
    query: `metadata['supabase_user_id']:'${userId}'`,
  });

  if (existing.data.length > 0) return existing.data[0].id;

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });
  return customer.id;
}
