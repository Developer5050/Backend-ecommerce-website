const Order = require("../models/orderModel");
const sendEmail = require("../utils/sendEmail");
const mongoose = require("mongoose");

const createOrder = async (req, res) => {
  try {
    console.log("👉 Incoming Order Request:");
    console.log(JSON.stringify(req.body, null, 2));

    const customerId = req.user?.userId;

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized - No customer ID" });
    }

    console.log("👤 Customer ID:", customerId);

    const { customerInfo, items, pricing, payment, shipping } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Bad Request - No items in order" });
    }
    if (!customerInfo || !customerInfo.email || !customerInfo.name) {
      return res.status(400).json({ message: "Bad Request - Missing customer information" });
    }

    // Generate order number (e.g., ORD-20250812-0001)
    const count = await Order.countDocuments();
    const orderNumber = `ORD-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${(count + 1).toString().padStart(4, "0")}`;

    // Create order document
    const order = new Order({
      orderNumber,
      customerId,
      customerInfo,
      items,
      pricing,
      payment,
      shipping,
      currentStatus: "PENDING_PAYMENT",
      statusHistory: [
        {
          status: "PENDING_PAYMENT",
          timestamp: new Date(),
          notes: "Order created.",
        },
      ],
    });

    const saved = await order.save();
    console.log("✅ Order saved:", saved._id);

    // Send confirmation email to user
    await sendEmail({
      to: customerInfo.email,
      subject: `Order Confirmation - ${orderNumber}`,
      html: `
        <h2>Thank you for your order!</h2>
        <p>Your order number is <strong>${orderNumber}</strong>.</p>
        <p>We will notify you once your order is processed.</p>
        <br />
        <p>Best regards,</p>
        <p><strong>Shop Support Team</strong></p>
      `,
    });

    // Prepare items table for admin email
    const itemsHtml = saved.items.map(item => `
      <tr>
        <td style="padding: 6px; border: 1px solid #ccc;">${item.name}</td>
        <td style="padding: 6px; border: 1px solid #ccc;">${item.quantity}</td>
        <td style="padding: 6px; border: 1px solid #ccc;">$${item.price}</td>
      </tr>
    `).join("");

    const adminEmailHtml = `
      <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px;">
        <tr><td colspan="3" style="padding: 10px; background-color: #f4f4f4; font-weight: bold;">🛒 New Order Details</td></tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ccc;"><strong>Customer Name:</strong></td>
          <td style="padding: 8px; border: 1px solid #ccc;" colspan="2">${saved.customerInfo.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ccc;"><strong>Email:</strong></td>
          <td style="padding: 8px; border: 1px solid #ccc;" colspan="2">${saved.customerInfo.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ccc;"><strong>Order ID:</strong></td>
          <td style="padding: 8px; border: 1px solid #ccc;" colspan="2">${saved.orderNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ccc;"><strong>Shipping Method:</strong></td>
          <td style="padding: 8px; border: 1px solid #ccc;" colspan="2">${saved.shipping?.method || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ccc;"><strong>Payment Method:</strong></td>
          <td style="padding: 8px; border: 1px solid #ccc;" colspan="2">${saved.payment?.method || "N/A"}</td>
        </tr>
        <tr>
          <th style="padding: 6px; background-color: #eee; border: 1px solid #ccc;">Item</th>
          <th style="padding: 6px; background-color: #eee; border: 1px solid #ccc;">Quantity</th>
          <th style="padding: 6px; background-color: #eee; border: 1px solid #ccc;">Price</th>
        </tr>
        ${itemsHtml}
        <tr>
          <td style="padding: 8px; border: 1px solid #ccc;" colspan="2"><strong>Total:</strong></td>
          <td style="padding: 8px; border: 1px solid #ccc;">$${saved.pricing.grandTotal}</td>
        </tr>
      </table>
    `;

    console.log("📧 Sending email to admin:", process.env.ADMIN_EMAIL);

    // Send order details email to admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `New Order Received - ${orderNumber}`,
      html: adminEmailHtml,
    });

    // Respond with the saved order
    return res.status(201).json(saved);

  } catch (err) {
    console.error("❌ Order creation error:", err);

    if (err.name === "ValidationError") {
      for (const field in err.errors) {
        console.error(`❗ Validation error on "${field}": ${err.errors[field].message}`);
      }
    }

    return res.status(500).json({
      message: "Order not created",
      error: err.message,
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch orders", error: err.message });
  }
};

const getOrdersByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const orders = await Order.find({ customerId: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user orders",
      error: error.message,
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete order", error: err.message });
  }
};

const editOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (req.body.customerInfo?.paymentMethod) {
      order.payment.method = req.body.customerInfo.paymentMethod;
    }

    if (req.body.currentStatus) {
      order.currentStatus = req.body.currentStatus;
      order.statusHistory.push({
        status: req.body.currentStatus,
        timestamp: new Date(),
        notes: req.body.notes || "Status updated",
      });
    }

    const savedOrder = await order.save();
    res.status(200).json(savedOrder);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update order", error: err.message });
  }
};

const getOrderCount = async (req, res) => {
  try {
    const count = await Order.countDocuments();
    res.status(200).json({ totalOrders: count });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch order count", error: err.message });
  }
};

const statusOrderUpdated = async (req, res) => {
  try {
    const { currentStatus } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.statusHistory.push({
      status: currentStatus,
      timestamp: new Date(),
      notes: `Status changed to ${currentStatus}`,
    });

    order.currentStatus = currentStatus;

    if (currentStatus === "PAID") {
      order.payment = {
        ...order.payment,
        status: "SUCCEEDED",
      };
    }

    await order.save();

    res.status(200).json({
      message: "Order status updated successfully",
      updatedStatus: order.currentStatus,
    });
  } catch (error) {
    console.error("❌ Order status update error:", error);
    res.status(500).json({
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrdersByUserId,
  deleteOrder,
  editOrder,
  getOrderCount,
  statusOrderUpdated,
};
