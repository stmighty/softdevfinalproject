const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_API_KEY ?? "", {
  apiVersion: "2023-10-16",
  typescript: true,
});

module.exports = stripe;
