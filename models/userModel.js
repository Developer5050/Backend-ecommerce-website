const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: function () {
      return !this.googleId;
    },
  },
  role: { type: Number, default: 0, enum: [0, 1] }, // 0 = User, 1 = Admin
  accessToken: { type: String },

  // Google OAuth fields
  googleId: { type: String, unique: true, sparse: true }, // Google ka unique ID
  googleDisplayName: { type: String }, // Google profile name

  // 👇 Add these for password reset
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
