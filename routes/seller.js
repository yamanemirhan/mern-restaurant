const express = require("express");
const {
  addProduct,
  deleteProduct,
  updateProduct,
  getProducts,
} = require("../controllers/seller");
const { getAccessToRoute } = require("../middlewares/authorization/auth");
const {
  checkSellerExists,
  checkProductExist,
  checkHasProduct,
} = require("../middlewares/database/databaseErrorHelpers");
const profileImageUpload = require("../middlewares/libraries/profileImageUpload");

const router = express.Router();

router.post(
  "/add-product",
  [
    getAccessToRoute,
    checkSellerExists,
    profileImageUpload.single("product_image"),
  ],
  addProduct
);

router.delete(
  "/product/delete/:productId",
  [getAccessToRoute, checkProductExist, checkHasProduct],
  deleteProduct
);

router.put(
  "/product/update/:productId",
  [
    getAccessToRoute,
    checkProductExist,
    checkHasProduct,
    profileImageUpload.single("product_image"),
  ],
  updateProduct
);

router.get("/getProducts", getAccessToRoute, checkSellerExists, getProducts);

module.exports = router;
