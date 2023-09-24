const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
  {
    text: {
      type: String,
      maxlength: [500, "Please provide a text with maximum 500 characters"],
    },
    star: {
      type: Number,
    },
    user: {
      id: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      fullName: {
        type: String,
      },
      profilePicture: {
        type: String,
      },
    },
    product: {
      id: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
      },
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Comment", CommentSchema);
