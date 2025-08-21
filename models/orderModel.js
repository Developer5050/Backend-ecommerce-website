const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
      "PENDING_PAYMENT",
      "PAID",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "REFUNDED",
    ],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  notes: String,
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: String,
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Users",
    },
    customerInfo: {
      name: String,
      email: String,
      phone: String,
    },
    statusHistory: [statusSchema],
    currentStatus: {
      type: String,
      enum: [
        "PENDING_PAYMENT",
        "PAID",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "REFUNDED",
      ],
      default: "PENDING_PAYMENT",
    },
    pricing: {
      currency: { type: String, default: "PKR" },
      subtotal: Number,
      discounts: [
        {
          code: String,
          amount: Number,
        },
      ],
      taxes: Number,
      shipping: Number,
      grandTotal: Number,
    },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        sku: String,
        name: String,
        image: String,
        quantity: Number,
        price: Number,
      },
    ],
    payment: {
      method: {
        type: String,
        enum: ["CASH_ON_DELIVERY", "STRIPE"],
      },
      transactionId: {
        type: String,
        default: null,
      },
      status: {
        type: String,
        enum: ["PENDING", "SUCCEEDED", "FAILED"],
        default: "PENDING",
      },
    },
    shipping: {
      address: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String,
      },
      method: String,
      trackingNumber: String,
      shippedAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
