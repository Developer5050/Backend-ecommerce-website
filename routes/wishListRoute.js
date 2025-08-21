const express = require("express");
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  deleteWishlist,
} = require("../controllers/wishListController");
const authMiddleware = require("../middlewares/auth");

router.get("/:userId", authMiddleware, getWishlist);
router.post("/add", authMiddleware, addToWishlist);
router.delete("/delete/:userId/:productId", authMiddleware, removeFromWishlist);

router.delete("/delete/:userId", authMiddleware, deleteWishlist);

module.exports = router;
