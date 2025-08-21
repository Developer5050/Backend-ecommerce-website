const userSchema = require("../validate/userValidate");
const User = require("../models/userModel");
const jwtService = require("../services/jwtService");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const RefreshToken = require("../models/refreshModel");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || role === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // User Error Validate
    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Existing Email Checked
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists!" });
    }

    // Password Hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create New User Role Base
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role, // Default role = 0 (User) // add
    });

    await user.save();

    // Generate Access Token
    const accessToken = jwtService.signAccessToken(
      { id: user._id, name: user.name, email: user.email },
      "30m"
    );

    // Generate Refresh Token
    const refreshToken = jwtService.signRefreshToken({ id: user._id }, "60m");

    await jwtService.storeRefreshToken(refreshToken, user._id);

    // Role Base check user or admin
    const redirectURL = role === 1 ? "/admin-dashboard" : "/user-dashboard";

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
      redirect: redirectURL,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Check if email exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // ✅ Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ Generate access token (30m expiry)
    // const accessToken = jwtService.signAccessToken(
    //   { _id: user._id, name: user.name, role: user.role,  },
    //   "7d"
    // );
    const accessToken = jwtService.signAccessToken(
      { userId: user._id, name: user.name, email: user.email, role: user.role },
      "7d"
    );

    // ✅ Generate refresh token (60m expiry or more)
    const refreshToken = jwtService.signRefreshToken(
      { userId: user._id },
      "7d"
    );

    user.accessToken = accessToken;
    await user.save();

    // ✅ Store refresh token (e.g. DB, Redis — here just a stub)
    await jwtService.storeRefreshToken(refreshToken, user._id);

    // ✅ Send response
    return res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh Token are Required!",
      });
    }

    await RefreshToken.deleteOne({ token: RefreshToken });

    return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Server error during logout" });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    console.log("Decoded User ID:", userId); // ✅
    const user = await User.findById(userId).select("name email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

const updateProfile = async (req, res) => {
  const { name, email } = req.body;
  const userId = req.user?.userId;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({ message: "Update failed" });
  }
};

const forgetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "Email not found" });

    const token = crypto.randomBytes(20).toString("hex");

    (user.resetPasswordToken = token),
      (user.resetPasswordExpires = Date.now() + 3600000);

    await user.save();

    // Send Email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `http://localhost:5173/reset-password/${token}`;

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password</p>`,
    });

    res.json({ message: "Reset link sent to email" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // ✅ Hash & update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { googleId, email, name, avatar } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ message: "Invalid Google data" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        googleId,
        avatar,
        role: 0, // default role
      });
      await user.save();
    }

    // ✅ JWT payload must match normal login
    const accessToken = jwtService.signAccessToken(
      {
        userId: user._id,  
        name: user.name,
        email: user.email,
        role: user.role,
      },
      "7d"
    );

    const refreshToken = jwtService.signRefreshToken(
      { userId: user._id },
      "7d"
    );

    user.accessToken = accessToken;
    await user.save();
    await jwtService.storeRefreshToken(refreshToken, user._id);

    return res.status(200).json({
      message: "Google login successful",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  forgetPassword,
  resetPassword,
  googleLogin
};
