const asyncErrorWrapper = require("express-async-handler");
const User = require("../models/User");
const Product = require("../models/Product");
const Comment = require("../models/Comment");
const {
  productSortHelper,
  paginationHelper,
} = require("../middlewares/query/queryMiddlewareHelpers");

const getProducts = async (req, res, next) => {
  try {
    const createQuery = (user, query) => {
      return {
        $and: [
          { "seller.id": user.id },
          {
            $or: [
              { name: { $regex: query.search || "", $options: "i" } },
              { category: { $regex: query.search || "", $options: "i" } },
              { desc: { $regex: query.search || "", $options: "i" } },
              {
                "seller.company": {
                  $regex: query.search || "",
                  $options: "i",
                },
              },
              {
                "ingredients.name": {
                  $regex: query.search || "",
                  $options: "i",
                },
              },
            ],
          },
        ],
      };
    };

    let query = Product.find(createQuery(req.user, req.query));

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

    const totalQuery = createQuery(req.user, req.query);

    const total = await Product.find(totalQuery).countDocuments();

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

const addProduct = asyncErrorWrapper(async (req, res, next) => {
  try {
    const information = JSON.parse(req.body.productData);
    const user = await User.findById(req.user.id);
    const newProduct = await Product.create({
      ...information,
      img: req.savedImage,
      ["seller.id"]: req.user.id,
      ["seller.company"]: user.seller.company,
      ["seller.profilePicture"]: user.profilePicture,
    });

    user.seller.products.push(newProduct._id);
    user.seller.productCount = user.seller.products.length;
    await user.save();
    res.status(200).json({
      success: true,
      message: "The product was successfully added",
      data: newProduct,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

const updateProduct = asyncErrorWrapper(async (req, res, next) => {
  try {
    const productInfo = JSON.parse(req.body.productData);
    if (req.savedImage) {
      productInfo.img = req.savedImage;
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productInfo,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Product has updated successfully",

      data: product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

const deleteProduct = asyncErrorWrapper(async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    const userId = product.seller.id;
    const user = await User.findById(userId);

    const productIndex = user.seller.products.indexOf(id);
    user.seller.products.splice(productIndex, 1);
    user.seller.productCount = user.seller.products.length;
    await user.save();

    await Promise.all(
      product.likes.map(async (userId) => {
        const user = await User.findById(userId);
        const productIndex = user.likedProducts.indexOf(id);
        user.likedProducts.splice(productIndex, 1);
        user.likedProductsCount = user.likedProducts.length;
        await user.save();
      })
    );

    await Promise.all(
      product.comments.map(async (commentId) => {
        await Comment.findByIdAndDelete(commentId);
      })
    );

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product has deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

module.exports = {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
};
