const CustomError = require("../../helpers/error/CustomError");
const User = require("../../models/User");
const asyncErrorWrapper = require("express-async-handler");
const Product = require("../../models/Product");
const Comment = require("../../models/Comment");

const checkUserExists = asyncErrorWrapper(async (req, res, next) => {
  const id = req.params.id || req.query.id;
  const user = await User.findById({ _id: id });
  if (!user) {
    return next(new CustomError("User Not Found!", 500));
  }
  next();
});

const checkSellerExists = asyncErrorWrapper(async (req, res, next) => {
  const id = req.params.id || req.user.id;
  const user = await User.findById(id);
  if (user.role !== "seller") {
    return next(new CustomError("This user is not seller", 400));
  }
  next();
});

const checkProductExist = asyncErrorWrapper(async (req, res, next) => {
  const id = req.params.productId;
  const product = await Product.findById(id);
  if (!product) {
    return next(new CustomError("Product Not Found!", 400));
  }
  next();
});

const checkCommentExist = asyncErrorWrapper(async (req, res, next) => {
  const id = req.params.commentId;
  const comment = await Comment.findById(id);
  if (!comment) {
    return next(new CustomError("Comment Not Found!", 400));
  }
  next();
});

const checkHasProduct = asyncErrorWrapper(async (req, res, next) => {
  const id = req.params.productId;
  const product = await Product.findById(id);
  if (req.user.role == "admin" || product.seller.id == req.user.id) {
    return next();
  }
  return next(
    new CustomError(
      "You dont have access to update or delete this product",
      401
    )
  );
});

const checkEmailExists = asyncErrorWrapper(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({
    email,
  });
  if (!user) return next(new CustomError("Invalid email or password", 400));

  next();
});

module.exports = {
  checkUserExists,
  checkEmailExists,
  checkSellerExists,
  checkProductExist,
  checkHasProduct,
  checkCommentExist,
};
