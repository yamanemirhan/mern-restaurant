const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    ingredients: [
      {
        type: String,
      },
    ],
    seller: {
      id: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      company: {
        type: String,
      },
      profilePicture: {
        type: String,
        default: "",
      },
      products: [
        {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
        },
      ],
      productCount: {
        type: Number,
        default: 0,
      },
    },
    img: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Comment",
      },
    ],
    star: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
