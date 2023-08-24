const asyncErrorWrapper = require("express-async-handler");
const CustomError = require("../helpers/error/CustomError");
const { comparePassword } = require("../helpers/input/inputHelpers");
const Comment = require("../models/Comment");
const Product = require("../models/Product");
const User = require("../models/User");

const deleteUser = asyncErrorWrapper(async (req, res, next) => {
  const { password } = req.body;

  try {
    const user = await User.findById(req.user.id).select("+password");

    if (!comparePassword(password, user.password)) {
      return next(new CustomError("Wrong password!", 400));
    }

    if (user.role == "seller") {
      user.seller.company = "";
      await Promise.all(
        user.seller.products.map(async (productId) => {
          const product = await Product.findOne({ _id: productId });
          await Promise.all(
            product.favs.map(async (userId) => {
              const user = await User.findOneAndUpdate(
                { _id: userId },
                {
                  $pull: {
                    favProducts: productId,
                  },
                },
                { new: true }
              );
              await user.save();
            })
          );
          await Promise.all(
            product.comments.map(async (commentId) => {
              await Comment.findByIdAndDelete(commentId);
            })
          );
          await product.deleteOne({ _id: productId });
        })
      );
    }

    await user.deleteOne({ _id: req.user.id });

    res.status(200).json({
      success: true,
      message: "Account is deleted!",
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

const editDetails = asyncErrorWrapper(async (req, res, next) => {
  const information = JSON.parse(req.body.user_data);

  try {
    if (information.address) {
      const user = await User.findById(req.user.id);
      user.addresses.push(information.address);
      user.save();
      return res.status(200).json({
        success: true,
        data: user.addresses,
        message: "Address added successfully",
      });
    }
    if (information.addresses) {
      const user = await User.findById(req.user.id);
      user.addresses = information.addresses;
      user.save();
      return res.status(200).json({
        success: true,
        data: user.addresses,
        message: "Address deleted successfully",
      });
    }

    const { company, about, addresses, address, ...other } = information;

    const updatedFields = {};
    if (company) {
      updatedFields["seller.company"] = company;
      await Product.updateMany(
        { "seller.id": req.user.id },
        { $set: { "seller.company": company } }
      );
    }
    if (about) {
      updatedFields["seller.about"] = about;
      await Product.updateMany(
        { "seller.id": req.user.id },
        { $set: { "seller.about": about } }
      );
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
    ).select("-__v -_id");

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

const changePassword = asyncErrorWrapper(async (req, res, next) => {
  const { id } = req.user;
  const { password } = req.body;

  const user = await User.findById(id).select("+password");
  if (comparePassword(password, user.password)) {
    return next(
      new CustomError(
        "The new password can not be the same as the old password",
        400
      )
    );
  }
  user.password = password;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

const getUser = asyncErrorWrapper(async (req, res, next) => {
  const { id } = req.user;
  const user = await User.findById(id).select("-__v -_id");

  res.status(200).json({
    success: true,
    data: user,
  });
});

const addOrder = asyncErrorWrapper(async (req, res, next) => {
  const orders = req.body.orders;
  const productIds = orders.map((order) => Object.keys(order)[0]);
  const products = await Product.find({ _id: { $in: productIds } });

  if (!products || products.length !== productIds.length) {
    return next(new CustomError("Products Not Found", 400));
  }
  try {
    await Promise.all(
      products.map(async (product) => {
        const orderedQuantity = orders.find(
          (order) => order[product.id.toString()]
        );

        if (
          !orderedQuantity ||
          product.stock < orderedQuantity[product.id.toString()]
        ) {
          throw new CustomError(product.name + " is out of stock", 400);
        }
      })
    );

    await Promise.all(
      products.map(async (product) => {
        const orderedQuantity = orders.find(
          (order) => order[product.id.toString()]
        )[product.id.toString()];

        await User.findByIdAndUpdate(
          req.user.id,
          {
            $push: {
              orders: {
                productId: product.id,
                name: product.name,
                price: product.price,
                unit: orderedQuantity,
                img: product.img,
                seller: product.seller,
                createdAt: Date.now(),
              },
            },
          },
          {
            new: true,
          }
        ).exec();

        await Product.updateOne(
          { _id: product.id },
          { $inc: { stock: -orderedQuantity } }
        );
      })
    );

    const updatedUser = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      message:
        "The product ordered successfully. You can add a review from My Orders page.",
      orders: updatedUser.orders,
    });
  } catch (error) {
    return next(error);
  }
});

const getCart = async (req, res, next) => {
  try {
    const cartItems = req.body;
    const selectedProducts = [];

    for (const item of cartItems) {
      const productId = Object.keys(item)[0];
      const quantity = item[productId];
      const product = await Product.findById(productId);

      if (!product) {
        continue;
      }

      if (product.stock === 0) {
        continue;
      }

      const selectedProduct = {
        ...product.toObject(),
        quantity: product.stock < quantity ? product.stock : quantity,
      };

      selectedProducts.push(selectedProduct);
    }
    res.status(200).json({
      success: true,
      data: selectedProducts,
    });
  } catch (error) {
    next(error);
  }
};

const favProduct = asyncErrorWrapper(async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (product.favs.includes(req.user.id)) {
      await product.updateOne({
        $pull: {
          favs: req.user.id,
        },
      });
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          $pull: {
            favProducts: req.params.productId,
          },
        },
        {
          new: true,
        }
      ).select("-__v");
      await user.save();
      res.status(200).json({
        success: true,
        message: "The product has been removed from your favorites list",
        data: user.favProducts,
      });
    } else {
      await product.updateOne({
        $push: {
          favs: req.user.id,
        },
      });
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          $push: {
            favProducts: req.params.productId,
          },
        },
        {
          new: true,
        }
      ).select("-__v");
      await user.save();
      res.status(200).json({
        success: true,
        message: "The product has been added to your favorites list",
        data: user.favProducts,
      });
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
});

const addComment = asyncErrorWrapper(async (req, res, next) => {
  try {
    const info = req.body;

    if (!info.text && !info.star) {
      return next(new CustomError("Fill in at least one field", 400));
    }
    const product = await Product.findById(req.params.productId);
    const user = await User.findById(req.user.id);
    const order = user.orders.find((order) => order.id === info.orderId);

    if (!product) {
      if (order) {
        order.comment = "This product is removed";
        user.markModified("orders");
        await user.save();
        return res.status(400).json({
          success: false,
          data: order,
          message: "This product is removed",
        });
      }
    }
    order.comment = info.text;
    order.star = info.star;
    user.markModified("orders");
    await user.save();
    const fullName = user.firstName[0] + "**** " + user.lastName[0] + "****";
    const newComment = await Comment.create({
      text: info.text,
      star: info.star,
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
    if (info.star) {
      if (product.comments.length === 0) {
        product.star = Number(info.star);
      } else {
        const star = product.star || 0;
        const newStar = (star + Number(info.star)) / 2;
        product.star = Number(newStar.toFixed(1));
      }
      await product.save();
    }

    res.status(201).json({
      success: true,
      data: order,
      message: "Comment added succesfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

const getFavProducts = asyncErrorWrapper(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let favProducts = [];
    await Promise.all(
      user.favProducts.map(async (productId) => {
        const favProduct = await Product.findOne({
          _id: productId,
          sellerBlockState: false,
        });
        !favProduct || favProducts.push(favProduct);
      })
    );
    res.status(200).json({
      data: favProducts,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = {
  deleteUser,
  editDetails,
  changePassword,
  getUser,
  addOrder,
  favProduct,
  getCart,
  addComment,
  getFavProducts,
};
