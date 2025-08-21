const Product = require("../models/productModel");
const mongoose = require("mongoose");

const getallproducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch all products" });
  }
};

const getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find({ isNewArrival: true }).limit(8);
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching new arrivals" });
  }
};

const getTopProducts = async (req, res) => {
  try {
    const products = await Product.find({ isTopProduct: true }).limit(8);
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching top products" });
  }
};

const getByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    const products = await Product.find({ category: category });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error });
  }
};

const getBySubCategory = async (req, res) => {
  try {
    const products = await Product.find({
      subCategory: { $regex: new RegExp(`^${subCategoryParam}$`, "i") },
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

const addProduct = async (req, res) => {
  try {
    const {
      title,
      desc,
      price,
      stock,
      discount,
      rating,
      size,
      featured,
      category,
      isNewArrival,
      isTopProduct,
      subCategory,
    } = req.body;

    let color = req.body.color;
    let sizes = size;

    if (!Array.isArray(color)) {
      color = [color];
    }

    if (!Array.isArray(sizes)) {
      sizes = [sizes];
    }

    // // ✅ full URL banani chahiye
    // const imagePath = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const newProduct = new Product({
      title,
      desc,
      image: req.file ? req.file.filename : null, // ✅ save full URL instead of relative path
      price,
      stock,
      discount,
      rating,
      category,
      color,
      size: sizes,
      featured,
      isNewArrival,
      isTopProduct,
      subCategory,
    });

    await newProduct.save();

    res.status(201).json({
      message: "Product created successfully",
      product: newProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add product",
      error: error.message,
    });
  }
};


const editProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const {
      title,
      desc,
      price,
      stock,
      discount,
      rating,
      featured,
      category,
      isNewArrival,
      isTopProduct,
      subCategory,
    } = req.body;

    // Normalize color input
    let color = req.body.color;
    if (color && !Array.isArray(color)) {
      color = [color];
    }

    const image = req.file ? req.file.filename : null;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update fields conditionally
    product.title = title ?? product.title;
    product.desc = desc ?? product.desc;
    product.price = price ?? product.price;
    product.stock = stock ?? product.stock;
    product.discount = discount ?? product.discount;
    product.rating = rating ?? product.rating;
    product.featured = featured ?? product.featured;
    product.category = category ?? product.category;
    product.subCategory = subCategory ?? product.subCategory;
    product.isNewArrival = isNewArrival ?? product.isNewArrival;
    product.isTopProduct = isTopProduct ?? product.isTopProduct;

    if (color?.length) {
      product.color = color;
    }

    if (image) {
      product.image = image;
    }

    await product.save();

    res.status(200).json({ message: "Product updated", product });
  } catch (error) {
    res.status(500).json({ message: "Edit failed", error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const deleted = await Product.findByIdAndDelete(productId);

    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product deleted successfully",
      deletedProduct: deleted,
    });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
};

const productById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// api/products/search?query=jeans
const searchProducts = async (req, res) => {
  const query = req.query.query;
  try {
    const regex = new RegExp(query, "i");
    const products = await Product.find({
      $or: [
        { title: regex }, // ✅ Must have this
        { name: regex },
        { category: regex },
        { subCategory: regex },
      ],
    });
    res.json(products);
  } catch (err) {
    console.error("Search error:", err); // ✅ log error
    res.status(500).json({ message: "Search failed" });
  }
};

module.exports = {
  getallproducts,
  getNewArrivals,
  getTopProducts,
  getByCategory,
  getBySubCategory,
  addProduct,
  editProduct,
  deleteProduct,
  productById,
  searchProducts,
};
