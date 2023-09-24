const express = require("express");
const {
  getAllProducts,
  getProduct,
  getLikedProducts,
  getPopularProducts,
} = require("../controllers/product");
const { getAccessToRoute } = require("../middlewares/authorization/auth");
const {
  checkProductExist,
} = require("../middlewares/database/databaseErrorHelpers");
const router = express.Router();

router.get("/getAllProducts", getAllProducts);
router.get("/detail/:id", checkProductExist, getProduct);
router.get("/liked", getAccessToRoute, getLikedProducts);
router.get("/popular", getPopularProducts);

module.exports = router;
