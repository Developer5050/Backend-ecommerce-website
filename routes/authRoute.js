const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  updateProfile,
  getProfile,
  forgetPassword,
  resetPassword,
  googleLogin,
} = require("../controllers/authController");
const authMiddleware = require("../middlewares/auth");
const passport = require("passport");
const JWTservice = require("../services/jwtService");

// register
router.post("/register", register);

// login
router.post("/login", login);

//logout
router.post("/logout", logout);

// current user profile
router.get("/profile", authMiddleware, getProfile);

// update current profile
router.put("/update-profile", authMiddleware, updateProfile);

// forget Password
router.post("/forgot-password", forgetPassword);

// reset Password
router.post("/reset-password/:token", resetPassword);

router.post("/google-login", googleLogin);

// google authentication
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "consent",
  })
);

// 2️⃣ Google Callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    try {
      // ✅ Sign access and refresh tokens with proper payload
      const accessToken = JWTservice.signAccessToken(
        {
          userId: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
        "7d"
      );

      const refreshToken = JWTservice.signRefreshToken(
        { userId: req.user._id },
        "7d"
      );

      await JWTservice.storeRefreshToken(refreshToken, req.user._id);

      req.user.accessToken = accessToken;
      await req.user.save();

      // ✅ Redirect with correct query params
      res.redirect(
        `${process.env.CLIENT_URL}/google-redirect?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${req.user._id}&name=${req.user.name}&email=${req.user.email}&role=${req.user.role}&avatar=${req.user.avatar}`
      );
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(`${process.env.CLIENT_URL}/login`);
    }
  }
);


// 3️⃣ Logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect(process.env.CLIENT_URL);
  });
});

module.exports = router;
