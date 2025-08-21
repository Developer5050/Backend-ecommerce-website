const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/orderModel");

const createCheckoutSession = async (req, res) => {
  try {
    const customerId = req.user?.userId;
    // ✅ correctly get it

    console.log("🔐 Customer ID:", customerId);

    const { items, customerInfo, pricing, shipping } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart items are required." });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `http://localhost:5173/order-confirmed`,
      cancel_url: `http://localhost:5173/billing`,
      line_items: items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.title || item.name || "Untitled Product",
            images: [`http://localhost:8080/uploads/${item.image}`],
          },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      })),
      metadata: {
        customerInfo: JSON.stringify(customerInfo),
        items: JSON.stringify(items),
        pricing: JSON.stringify(pricing),
        shipping: JSON.stringify(shipping),
      },
    });

    const newOrder = new Order({
      customerId, // ✅ now it's correct
      customerInfo,
      items,
      pricing: {
        ...pricing,
        tax: 0,
        shipping: 0,
        grandTotal: pricing.subtotal,
      },
      payment: {
        method: "STRIPE",
        transactionId: session.id,
        status: "PENDING",
      },
      shipping,
      currentStatus: "PENDING_PAYMENT",
      statusHistory: [
        {
          status: "PENDING_PAYMENT",
          timestamp: new Date(),
          notes: "Stripe session created",
        },
      ],
    });

    await newOrder.save();

    res.json({ id: session.id });
  } catch (error) {
    console.error("❌ Stripe Checkout Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { createCheckoutSession };
