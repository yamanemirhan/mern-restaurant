const express = require("express");
const {
  deleteUser,
  editDetails,
  changePassword,
  getUser,
  addOrder,
  favProduct,
  getCart,
  addComment,
} = require("../controllers/user");
const { getAccessToRoute } = require("../middlewares/authorization/auth");
const profileImageUpload = require("../middlewares/libraries/profileImageUpload");
const {
  checkProductExist,
} = require("../middlewares/database/databaseErrorHelpers");

const router = express.Router();

router.get("/profile", getAccessToRoute, getUser);
router.post("/cart", getCart);
router.put(
  "/edit",
  [getAccessToRoute, profileImageUpload.single("profile_image")],
  editDetails
);
router.put(
  "/:productId/fav",
  [getAccessToRoute, checkProductExist],
  favProduct
);
router.put("/addOrder", getAccessToRoute, addOrder);
router.put("/changePassword", getAccessToRoute, changePassword);

router.delete("/deleteAccount", getAccessToRoute, deleteUser);

router.post("/addComment/:productId", getAccessToRoute, addComment);

module.exports = router;
