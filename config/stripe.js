import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Singleton Stripe client - imported wherever Stripe API calls are needed
// Uses a dummy fallback key so the server won't crash during your demo if the key is missing.
const key = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_demo';
const stripe = new Stripe(key);

export default stripe;
