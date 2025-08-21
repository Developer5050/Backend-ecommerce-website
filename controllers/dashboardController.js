const Order = require("../models/orderModel");
const Product = require("../models/productModel");

// get dashboard Statistics
const getdashbaordStats = async (req, res) => {
  try {
    const allOrders = await Order.find();
    const paidOrders = allOrders.filter(
      (order) => order.currentStatus === "PAID"
    );

    // Orders that are not paid are considered active/pending
    const nonPaidOrders = allOrders.filter(
      (order) => order.currentStatus !== "PAID"
    );

    const completedOrders = paidOrders.length;
    const totalSales = paidOrders.length;

    const totalRevenue = paidOrders.reduce((acc, order) => {
      return acc + (order.pricing?.grandTotal || 0);
    }, 0);

    const uniqueCustomerIds = new Set(
      allOrders.map((order) => order.customerId?.toString()).filter(Boolean)
    );
    const totalCustomers = uniqueCustomerIds.size;

    const totalProducts = await Product.countDocuments();

    res.status(200).json({
      totalOrders: allOrders.length, // ✅ Only show non-paid orders
      completedOrders,
      totalSales,
      totalRevenue,
      totalCustomers,
      totalProducts,
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res
      .status(500)
      .json({ message: "Failed to get dashboard stats", error: err.message });
  }
};

module.exports = { getdashbaordStats };
