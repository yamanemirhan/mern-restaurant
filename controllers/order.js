const asyncErrorWrapper = require("express-async-handler");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Comment = require("../models/Comment");

const createOrder = asyncErrorWrapper(async (req, res, next) => {
  const { id } = req.user;
  const { item, quantity, amount, desc } = req.body;

  try {
    const product = await Product.findById(item);

    const order = new Order({
      item,
      quantity,
      amount,
      desc: desc ? desc : "",
      user: id,
      seller: product.seller.id,
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: "The product was successfully ordered",
      data: order,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

const fetchUserOrders = asyncErrorWrapper(async (req, res, next) => {
  const { id } = req.user;

  try {
    const orders = await Order.find({ user: id })
      .populate("item")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

const deleteOrder = asyncErrorWrapper(async (req, res, next) => {
  const { id } = req.params;

  try {
    await Order.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      data: id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

const fetchSellerOrders = asyncErrorWrapper(async (req, res, next) => {
  const { id } = req.user;

  try {
    const orders = await Order.find({ seller: id })
      .populate("item")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

const updateOrder = asyncErrorWrapper(async (req, res, next) => {
  const { status } = req.body;
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
      },
      {
        new: true,
        runValidators: true,
      }
    );
    // .populate("item");

    res.status(200).json({
      success: true,
      message: "The order was successfully updated",
      data: order,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

const addComment = asyncErrorWrapper(async (req, res, next) => {
  try {
    const { text, star } = req.body;

    const user = await User.findById(req.user.id);
    const product = await Product.findById(req.params.productId);
    const order = await Order.findById(req.params.orderId);

    if (order && !order.review) {
      return res.status(400).json({
        success: false,
        data: order,
        message: "You already review this order.",
      });
    }

    if (!product) {
      if (order) {
        return res.status(400).json({
          success: false,
          data: order,
          message: "This product is removed",
        });
      }
    }

    order.review.givenStar = star;
    order.review.text = text;

    const fullName = user.firstName[0] + "**** " + user.lastName[0] + "****";

    // update product comments
    const newComment = await Comment.create({
      text,
      star,
      ["user.id"]: req.user.id,
      ["user.fullName"]: fullName,
      ["user.profilePicture"]: req.user.profilePicture,
      ["product.id"]: product._id,
    });
    await product.updateOne({
      $push: {
        comments: newComment._id,
      },
    });

    if (star) {
      if (product.comments.length === 0) {
        product.star = star;
      } else {
        const pStar = product.star || 0;
        const newStar = (pStar + Number(star)) / 2;
        product.star = Number(newStar.toFixed(1));
      }
      await product.save();
    }

    await order.save();

    res.status(201).json({
      success: true,
      data: order,
      message: "Comment has added succesfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

module.exports = {
  createOrder,
  fetchUserOrders,
  deleteOrder,
  fetchSellerOrders,
  updateOrder,
  addComment,
};
