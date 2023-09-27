const asyncErrorWrapper = require("express-async-handler");
const User = require("../models/User");
const Product = require("../models/Product");
const Comment = require("../models/Comment");

const getUser = asyncErrorWrapper(async (req, res, next) => {
  const { id } = req.user;
  const user = await User.findById(id).select("-_id");

  res.status(200).json({
    success: true,
    data: user,
  });
});

const likeProduct = asyncErrorWrapper(async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product.likes.includes(req.user.id)) {
      await product.updateOne({
        $pull: {
          likes: req.user.id,
        },
      });
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          $pull: {
            likedProducts: req.params.id,
          },
        },
        {
          new: true,
        }
      );
      user.likedProductsCount = user.likedProducts.length;
      await user.save();

      res.status(200).json({
        success: true,
        message: "The product has been removed from your liked list",
        data: user,
      });
    } else {
      await product.updateOne({
        $push: {
          likes: req.user.id,
        },
      });
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          $push: {
            likedProducts: req.params.id,
          },
        },
        {
          new: true,
        }
      );
      user.likedProductsCount = user.likedProducts.length;
      await user.save();
      res.status(200).json({
        success: true,
        message: "The product has been added to your liked list",
        data: user,
      });
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
});

const editDetails = asyncErrorWrapper(async (req, res, next) => {
  const information = JSON.parse(req.body.userData);

  try {
    const { company, ...other } = information;

    const updatedFields = {};

    if (company) {
      updatedFields["seller.company"] = company;
      await Product.updateMany(
        { "seller.id": req.user.id },
        { $set: { "seller.company": company } }
      );
    }

    const user_ = await User.findById(req.user.id);
    const userComments = await Comment.find({ "user.id": req.user.id });
    const fullName = user_.firstName[0] + "**** " + user_.lastName[0] + "****";
    console.log(user_);
    console.log("comments: ", userComments);
    for (const comment of userComments) {
      comment.user.profilePicture = user_.profilePicture;
      comment.user.fullName = fullName;
      await comment.save();
    }
    
    await Product.updateMany(
      { "seller.id": req.user.id },
      { $set: { "seller.profilePicture": req.savedImage } }
    );

    const userUpdate = {
      ...other,
      ...updatedFields,
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...userUpdate,
        profilePicture: req.savedImage,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-_id");

    res.status(200).json({
      success: true,
      data: user,
      message: "User updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

const getRestaurant = asyncErrorWrapper(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id)
    .select("-_id")
    .populate("seller.products");

  res.status(200).json({
    success: true,
    data: user,
  });
});

const getPopularRestaurants = asyncErrorWrapper(async (req, res, next) => {
  try {
    const popularRestaurants = await User.aggregate([
      {
        $match: {
          "seller.products": { $exists: true, $ne: [] },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          company: "$seller.company",
          img: "$profilePicture",
          productCount: { $size: "$seller.products" },
        },
      },
      {
        $sort: { productCount: -1 },
      },
      {
        $limit: 8,
      },
    ]);

    res.status(200).json({
      success: true,
      data: popularRestaurants,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = {
  getUser,
  likeProduct,
  editDetails,
  getRestaurant,
  getPopularRestaurants,
};
