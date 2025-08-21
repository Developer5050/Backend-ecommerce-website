const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Wishlist = require("../models/wishListModel");
const { v4: uuidv4 } = require("uuid");

// Add to Cart
const addToCart = async (req, res) => {
  const { userId, productId, title, quantity, price, image } = req.body;

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, cartItems: [] });
    }

    // ✅ Ensure cart.cartItems is initialized
    if (!Array.isArray(cart.cartItems)) {
      cart.cartItems = [];
    }

    const existingItem = cart.cartItems.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.cartItems.push({
        _cartId: uuidv4(),
        productId,
        title,
        quantity,
        price,
        image,
      });
    }

    await cart.save();

    // ✅ Remove the product from wishlist
    await Wishlist.findOneAndUpdate(
      { userId },
      { $pull: { products: productId } }
    );

    const addedItem = cart.cartItems.find(
      (item) => item.productId == productId
    );

    res.status(200).json({ cartItem: addedItem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Add to cart failed" });
  }
};

const getCart = async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(200).json({
        success: true,
        userId,
        cartItems: [],
      });
    }

    res.status(200).json({
      success: true,
      userId: cart.userId,
      cartItems: cart.cartItems,
    });
  } catch (err) {
    console.error("Cart fetch error:", err);
    res.status(500).json({ error: "Failed to fetch cart items" });
  }
};

// const updateCart = async (req, res) => {
//   const { cartItemId } = req.params;
//   const { quantity, price } = req.body;

//   try {
//     const updatedItem = await Cart.findByIdAndUpdate(
//       cartItemId,
//       { quantity, price },
//       { new: true }
//     );
//     res.status(200).json({ success: true, updatedItem });
//   } catch (err) {
//     res.status(500).json({ error: "Failed to update cart item" });
//   }
// };
// routes/cart.js ya controller me:
const updateCart = async (req, res) => {
  const { userId, productId } = req.params;
  const { quantity } = req.body;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (quantity > product.stock) {
      return res
        .status(400)
        .json({ message: `Only ${product.stock} in stock` });
    }

    const item = cart.cartItems.find(
      (item) => item.productId.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    item.quantity = quantity;
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Quantity updated",
      cartItem: item,
    });
  } catch (err) {
    console.error("Update cart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteCartItem = async (req, res) => {
  const { userId, productId } = req.params;

  try {
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { cartItems: { productId } } },
      { new: true }
    );

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.status(200).json({
      success: true,
      message: `Removed product ${productId} from cart`,
      cartItems: cart.cartItems,
    });
  } catch (err) {
    console.error("Delete cart item error:", err);
    res.status(500).json({ error: "Failed to delete cart item" });
  }
};


const deleteCartByUserId = async (req, res) => {
  const { userId } = req.params;
  try {
    // Find the cart and set cartItems to empty array
    console.log("req.params:", req.params);
    console.log(`Clearing cart for user: ${userId}`);
    await Cart.deleteMany({ userId });
    res.status(200).json({ success: true, message: "Cart cleared for user" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear cart" });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCart,
  deleteCartItem,
  deleteCartByUserId,
};
