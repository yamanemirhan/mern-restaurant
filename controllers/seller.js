const asyncErrorWrapper = require("express-async-handler");
const User = require("../models/User");
const Product = require("../models/Product");
const Comment = require("../models/Comment");
const {
  productSortHelper,
  paginationHelper,
} = require("../middlewares/query/queryMiddlewareHelpers");

const updateProduct = asyncErrorWrapper(async (req, res, next) => {
  try {
    const productInfo = JSON.parse(req.body.product_data);
    if (req.savedImage) {
      productInfo.img = req.savedImage;
    }
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      productInfo,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: product,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

const deleteProduct = asyncErrorWrapper(async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    const userId = product.seller.id;
    const user = await User.findById(userId);

    const productIndex = user.seller.products.indexOf(productId);
    user.seller.products.splice(productIndex, 1);
    await user.save();

    await Promise.all(
      product.favs.map(async (userId) => {
        const user = await User.findById(userId);
        const productIndex = user.favProducts.indexOf(productId);
        user.favProducts.splice(productIndex, 1);
        await user.save();
      })
    );

    await Promise.all(
      product.comments.map(async (commentId) => {
        await Comment.findByIdAndDelete(commentId);
      })
    );

    await Product.findByIdAndDelete(productId);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

const addProduct = asyncErrorWrapper(async (req, res, next) => {
  try {
    const information = JSON.parse(req.body.product_data);
    const user = await User.findById(req.user.id);
    const newProduct = await Product.create({
      ...information,
      img: req.savedImage,
      ["seller.id"]: req.user.id,
      ["seller.company"]: user.seller.company,
      ["seller.about"]: user.seller.about,
      ["seller.profilePicture"]: user.profilePicture,
    });

    user.seller.products.push(newProduct._id);

    await user.save();
    res.status(200).json({
      success: true,
      data: newProduct,
      message: "Product added successfully",
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

const getProducts = async (req, res, next) => {
  try {
    let query = Product.find({
      $and: [
        { "seller.id": req.user.id },
        {
          $or: [
            { name: { $regex: req.query.search || "", $options: "i" } },
            { category: { $regex: req.query.search || "", $options: "i" } },
            { desc: { $regex: req.query.search || "", $options: "i" } },
            {
              "seller.company": {
                $regex: req.query.search || "",
                $options: "i",
              },
            },
          ],
        },
      ],
    });

    if (req.query.categories) {
      const categories = req.query.categories;
      query = query.where("category").in(categories);
    }

    if (req.query.minPrice || req.query.maxPrice) {
      const priceFilter = {};

      if (req.query.minPrice) {
        priceFilter.$gte = parseInt(req.query.minPrice);
      }

      if (req.query.maxPrice) {
        priceFilter.$lte = parseInt(req.query.maxPrice);
      }

      query = query.where("price", priceFilter);
    }

    query = productSortHelper(query, req);

    const totalQuery = {
      name: { $regex: req.query.search || "", $options: "i" },
    };

    if (req.query.categories) {
      const categories = req.query.categories;
      totalQuery.category = { $in: categories };
    }

    if (req.query.minPrice || req.query.maxPrice) {
      const priceFilter = {};

      if (req.query.minPrice) {
        priceFilter.$gte = parseInt(req.query.minPrice);
      }

      if (req.query.maxPrice) {
        priceFilter.$lte = parseInt(req.query.maxPrice);
      }

      totalQuery.price = priceFilter;
    }

    const total = await Product.find({
      "seller.id": req.user.id,
    }).countDocuments(totalQuery);

    const paginationResult = await paginationHelper(total, query, req);
    query = paginationResult.query;
    const pagination = paginationResult.pagination;

    const queryResults = await query;

    res.status(200).json({
      success: true,
      data: {
        count: total,
        pagination: pagination,
        products: queryResults,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

module.exports = {
  updateProduct,
  deleteProduct,
  addProduct,
  getProducts,
};
