const express = require("express");
const {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/seller");
const { getAccessToRoute } = require("../middlewares/authorization/auth");
const {
  checkSellerExists,
  checkProductExist,
  checkHasProduct,
} = require("../middlewares/database/databaseErrorHelpers");
const imageUpload = require("../middlewares/libraries/imageUpload");

const router = express.Router();

router.get("/getProducts", getAccessToRoute, checkSellerExists, getProducts);
router.post(
  "/add",
  [getAccessToRoute, checkSellerExists, imageUpload.single("product_image")],
  addProduct
);
router.put(
  "/update/:id",
  [
    getAccessToRoute,
    checkProductExist,
    checkHasProduct,
    imageUpload.single("product_image"),
  ],
  updateProduct
);
router.delete(
  "/delete/:id",
  [getAccessToRoute, checkProductExist, checkHasProduct],
  deleteProduct
);

module.exports = router;
