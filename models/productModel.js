const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: String,
  desc: String,
  image: String,
  price: Number,
  stock: Number,
  category: {
    type: String,
    enum: ["Men", "Women", "Kids"],
    required: true,
  },
  subCategory: {
    type: String,
    enum: [
      // Men
      "Jackets",
      "T-Shirts",
      "Jeans",
      "Shoes",

      // Women
      "Dress",
      "Handbags",
      "Heels",
      "Tops",
      "Watches",

      // Kids
      "Shorts",
      "Pants",
      "KidShirts",
    ],
    required: true,
  },
  color: {
    type: [String], // Array of colors like ["Red", "Blue"]
    required: true,
  },
  size: {
    type: [String], // Array of sizes like ["S", "M", "L"] or ["38", "39", "40"] for shoes
    required: true,
  },
  rating: Number,
  discount: Number,
  featured: {
    type: Boolean,
    default: false,
  },
  isNewArrival: {
    type: Boolean,
    default: false,
  },
  isTopProduct: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
