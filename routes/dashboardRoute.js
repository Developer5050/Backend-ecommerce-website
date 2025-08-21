const express = require("express");
const router = express.Router();

const { getdashbaordStats } = require("../controllers/dashboardController");

// Dashboard route
router.get("/dashboard-stats", getdashbaordStats);

module.exports = router;