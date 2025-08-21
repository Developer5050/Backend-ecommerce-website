const User = require("../models/userModel");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('_id name email');
    const usersWithId = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      
    }));
    res.status(200).json(usersWithId);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

const getAllCustomers = async (req, res) => {
  try {
   const users = await User.find({ role: "customer" }); // or User.find({ role: "user" }) if role-based
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to get customers" });
  }
};


module.exports = { getAllUsers, getAllCustomers };
