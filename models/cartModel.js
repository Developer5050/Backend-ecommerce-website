const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  cartItems: {
    type: [
      {
        productId: String,
        title: String,
        quantity: Number,
        price: Number,
        image: String,
      },
    ],
    default: [], // ✅ important!
  },
});

module.exports = mongoose.model("Cart", cartSchema);
