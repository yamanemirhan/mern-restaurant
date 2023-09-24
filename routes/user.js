const express = require("express");
const {
  getUser,
  likeProduct,
  editDetails,
  getRestaurant,
  getPopularRestaurants,
} = require("../controllers/user");
const { getAccessToRoute } = require("../middlewares/authorization/auth");
const imageUpload = require("../middlewares/libraries/imageUpload");
const {
  checkProductExist,
} = require("../middlewares/database/databaseErrorHelpers");

const router = express.Router();

router.get("/profile", getAccessToRoute, getUser);
router.put("/like/:id", [getAccessToRoute, checkProductExist], likeProduct);
router.put(
  "/edit",
  [getAccessToRoute, imageUpload.single("profile_image")],
  editDetails
);
router.get("/restaurant/:id", getRestaurant);
router.get("/restaurants/popular", getPopularRestaurants);

module.exports = router;
