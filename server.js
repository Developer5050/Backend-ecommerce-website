require("dotenv").config();
require("./db/passport");
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const dbConnection = require("./db/dbConnection");
const cors = require("cors");
const path = require("path");
const passport = require("passport");
const session = require("express-session");

const authRoutes = require("./routes/authRoute");
const productRoute = require("./routes/productRoute");
const orderRoute = require("./routes/orderRoute");
const userRoute = require("./routes/userRoute");
const cartRoute = require("./routes/cartRoute");
const dashboardRoute = require("./routes/dashboardRoute");
const wishListRoute = require("./routes/wishListRoute");
const stripeRoute = require("./routes/stripeRoute");

const port = process.env.PORT;

// DB
dbConnection();

// setup session
// jab user login kar ka tu encrpyted from ma id genrate kary ga jis ma decoded karna par user ka data show ho ga.
app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
  })
);

// Middlewares
// CORS setup
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL,
//     methods: "GET,POST,PUT,DELETE",
//     credentials: true,
//   })
// );

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); 

// Passport Initilize Setup
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use("/user/auth", authRoutes);
app.use("/api/products", productRoute);
app.use("/api/orders", orderRoute);
app.use("/api/users", userRoute);
app.use("/api/cart", cartRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/wishlist", wishListRoute);
app.use("/api/stripe", stripeRoute);

// Serve Vite build
app.use(express.static(path.join(__dirname, "../Frontend/dist")));

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/dist", "index.html"));
});

// Start server
app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
});
