const asyncErrorWrapper = require("express-async-handler");
const {
  productSortHelper,
  paginationHelper,
} = require("../middlewares/query/queryMiddlewareHelpers");
const Product = require("../models/Product");
const User = require("../models/User");
const Comment = require("../models/Comment");

const getAllProducts = asyncErrorWrapper(async (req, res, next) => {
  try {
    let query = Product.find({
      $or: [
        { name: { $regex: req.query.search || "", $options: "i" } },
        { category: { $regex: req.query.search || "", $options: "i" } },
        { desc: { $regex: req.query.search || "", $options: "i" } },
        { "seller.company": { $regex: req.query.search || "", $options: "i" } },
      ],
    });

    if (req.query.categories) {
      const categories = JSON.parse(req.query.categories);
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
      const categories = JSON.parse(req.query.categories);
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

    const total = await Product.countDocuments(totalQuery);

    const paginationResult = await paginationHelper(total, query, req);
    query = paginationResult.query;
    const pagination = paginationResult.pagination;

    const queryResults = await query;

    res.status(200).json({
      success: true,
      data: {
        count: queryResults.length,
        pagination: pagination,
        products: queryResults,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    const commentIds = product.comments;
    const comments = await Comment.find({ _id: { $in: commentIds } });

    res.status(200).json({
      success: true,
      data: {
        product,
        comments,
      },
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const getLikedProducts = asyncErrorWrapper(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let likedProducts = [];
    await Promise.all(
      user.likedProducts.map(async (productId) => {
        const likedProduct = await Product.findOne({
          _id: productId,
        }).select("-seller.id");
        !likedProduct || likedProducts.push(likedProduct);
      })
    );
    res.status(200).json({
      success: true,
      data: likedProducts,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

const getPopularProducts = asyncErrorWrapper(async (req, res, next) => {
  try {
    const popularProducts = await Product.find().sort({ star: -1 }).limit(8);

    res.status(200).json({
      success: true,
      data: popularProducts,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = {
  getAllProducts,
  getProduct,
  getLikedProducts,
  getPopularProducts,
};
