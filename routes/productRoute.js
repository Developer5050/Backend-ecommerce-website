const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multerConfig");
const { getNewArrivals, getTopProducts, getallproducts ,addProduct, editProduct, deleteProduct, productById, getByCategory, getBySubCategory,  searchProducts } = require("../controllers/productController");

// @route   POST /api/products
// @desc    Add a new product
router.get("/get-all-products", getallproducts);
router.get("/new-arrivals", getNewArrivals);;
router.get("/top-products" , getTopProducts);
router.get("/product/:id", productById);
router.get("/category/:category", getByCategory);
router.get("/subcategory/:subCategory", getBySubCategory);
router.get("/search" , searchProducts);

// product
router.post("/add-product", upload.single("image"), addProduct);
router.put("/edit-product/:id", upload.single("image"), editProduct);
router.delete("/delete-product/:id", deleteProduct);


module.exports = router;
