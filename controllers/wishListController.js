const Wishlist = require("../models/wishListModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");

const formatWishlist = async (userId) => {
  const wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: "products.productId",
    select: "title image price",
  });

  if (!wishlist) {
    return { user: null, products: [] };
  }

  return {
    user: wishlist.user,
    products: wishlist.products,
  };
};

const getWishlist = async (req, res) => {
  try {
    // const { userId } = req.params;
    const userId = req.user.userId;
    const wishlist = await formatWishlist(userId);

    if (!wishlist) {
      return res.json({ success: true, wishlist: [], user: null });
    }

    res.json({
      success: true,
      user: wishlist.user,
      products: wishlist.products,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// const addToWishlist = async (req, res) => {
//   try {
//     const { productId } = req.body;
//     // const userId = req.user ? req.user.id : req.body.userId;
//     const userId = req.user.userId;

//     const user = await User.findById(userId);
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     // Check if product exists
//     const product = await Product.findById(productId);
//     if (!product) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });
//     }

//     // Get or create wishlist
//     let wishlist = await Wishlist.findOne({ user: userId });
//     if (!wishlist) {
//       wishlist = new Wishlist({ user: userId, products: [] });
//     }

//     // Check for duplicates
//     const alreadyExists = wishlist.products.some(
//       (item) => item.productId.toString() === productId
//     );
//     if (alreadyExists) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Product already in wishlist" });
//     }

//     // Add product to wishlist
//     wishlist.products.push({ productId: product._id });
//     await wishlist.save();

//     // Populate products with selected fields
//     const updatedWishlist = await Wishlist.findOne({ user: userId }).populate({
//       path: "products.productId",
//       select: "title image price",
//     });

//     // Get last added wishlist product entry
//     const lastAddedProductEntry =
//       updatedWishlist.products[updatedWishlist.products.length - 1];

//     // Format products with string IDs
//     const formattedProducts = updatedWishlist.products.map((p) => ({
//       _id: p.productId._id.toString(),
//       title: p.productId.title,
//       image: p.productId.image,
//       price: p.productId.price,
//     }));

//     // Send response with string IDs
//     res.status(200).json({
//       success: true,
//       _id: lastAddedProductEntry._id.toString(), // wishlist entry id as string
//       user: {
//         _id: updatedWishlist.user.toString(), // user id as string
//       },
//       products: formattedProducts,
//     });
//   } catch (error) {
//     console.error("Error adding to wishlist:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.userId; // ✅ from auth middleware

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
    }

    const alreadyExists = wishlist.products.some(
      (item) => item.productId.toString() === productId
    );
    if (alreadyExists) {
      return res
        .status(400)
        .json({ success: false, message: "Product already in wishlist" });
    }

    wishlist.products.push({ productId: product._id });
    await wishlist.save();

    const updatedWishlist = await Wishlist.findOne({ user: userId }).populate({
      path: "products.productId",
      select: "title image price",
    });

    res.status(200).json({
      success: true,
      user: updatedWishlist.user,
      products: updatedWishlist.products,
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ from authMiddleware
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res
        .status(404)
        .json({ success: false, message: "Wishlist not found" });
    }

    // Remove product by ID
    wishlist.products = wishlist.products.filter(
      (p) => p.productId.toString() !== productId
    );
    await wishlist.save();

    // ✅ Return updated populated wishlist
    const updatedWishlist = await formatWishlist(userId);
    res.json({
      success: true,
      message: "Product removed from wishlist",
      user: updatedWishlist.user,
      products: updatedWishlist.products,
    });
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const deleteWishlist = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ from authMiddleware

    const deletedWishlist = await Wishlist.findOneAndDelete({ user: userId });

    if (!deletedWishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found or already deleted",
      });
    }

    res.status(200).json({
      success: true,
      message: "Wishlist deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting wishlist:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  deleteWishlist,
};
