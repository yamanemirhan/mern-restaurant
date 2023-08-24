const asyncErrorWrapper = require("express-async-handler");
const CustomError = require("../helpers/error/CustomError");

const Comment = require("../models/Comment");
const Product = require("../models/Product");

const deleteComment = asyncErrorWrapper(async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (req.user.role == "admin" || req.user.id == comment.user.id) {
      await Product.findByIdAndUpdate(comment.product.id, {
        $pull: {
          comments: comment._id,
        },
      });

      await comment.remove();
    } else {
      return next(
        new CustomError("You don't have permission to delete this comment", 401)
      );
    }
    res.status(200).json({
      success: true,
      message: "The comment has deleted successfully",
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = {
  deleteComment,
};
