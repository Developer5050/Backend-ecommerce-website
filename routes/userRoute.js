const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getAllCustomers,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/auth");

router.get("/", getAllUsers);
router.get("/customers", getAllCustomers);
router.get("/verify-token", authMiddleware, (req, res) => {
  res.json({ message: "Token is valid ✅", user: req.user });
});

module.exports = router;
