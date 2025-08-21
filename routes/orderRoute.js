const express = require("express");
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrdersByUserId,
  deleteOrder,
  editOrder,
  getOrderCount,
  statusOrderUpdated,
} = require("../controllers/orderController");
const authMiddleware = require("../middlewares/auth");

router.post("/", authMiddleware, createOrder);
router.get("/count/total", getOrderCount);
router.get("/", getAllOrders); // Fetch all Order Admin Side
router.get("/my-orders/:userId", getOrdersByUserId); // Fetch user's own orders
router.delete("/:id", deleteOrder);
router.put("/:id", editOrder);
router.put("/update-status/:id", statusOrderUpdated);

module.exports = router;
