const asyncErrorWrapper = require("express-async-handler");
const { sendJwtToClient } = require("../helpers/authorization/tokenHelpers");
const CustomError = require("../helpers/error/CustomError");
const User = require("../models/User");
const {
  validateUserInput,
  comparePassword,
} = require("../helpers/input/inputHelpers");

const register = asyncErrorWrapper(async (req, res, next) => {
  const infos = req.body;
  const email = req.body.email;
  try {
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return next(new CustomError("This email is already in use", 400));
    }

    let user;
    if (req.body.company) {
      user = await User.create({
        ...infos,
        seller: {
          company: req.body.company,
          about: req.body.about,
        },
        role: "seller",
      });
    } else {
      user = await User.create({
        ...infos,
      });
    }

    await user.save();

    return res.status(201).json({
      success: true,
      message: "Successfully registered",
    });
  } catch (err) {
    next(err);
  }
});

const login = asyncErrorWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  if (!validateUserInput(email, password)) {
    return next(new CustomError("Please check your inputs", 400));
  }
  const user = await User.findOne({ email }).select("+password");

  if (!comparePassword(password, user.password)) {
    return next(new CustomError("Please check your credentials", 400));
  }
  sendJwtToClient(user, res);
});

const logout = asyncErrorWrapper(async (req, res, next) => {
  return res
    .clearCookie("accessToken", {
      sameSite: "none",
      secure: true,
    })
    .status(200)
    .json({ message: "Logged out successfully" });
});

module.exports = {
  register,
  login,
  logout,
};
