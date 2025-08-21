const express = require("express");
const router = express.Router();

const {
  addToCart,
  getCart,
  updateCart,
  deleteCartItem,
  deleteCartByUserId,
} = require("../controllers/cartController");

router.post("/add", addToCart);
router.get("/:userId", getCart);
router.put("/update/:userId/:productId", updateCart);
router.delete("/:userId/item/:productId", deleteCartItem);

router.delete("/:userId", deleteCartByUserId);

module.exports = router;
