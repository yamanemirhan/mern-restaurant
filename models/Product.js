const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    seller: {
      id: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      company: {
        type: String,
      },
      about: {
        type: String,
      },
      profilePicture: {
        type: String,
        default: "",
      },
    },
    img: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
      enum: ["Phone", "Computer", "Laptop", "Tablet"],
    },
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    detail: {
      type: String,
      required: true,
    },
    favs: [
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
