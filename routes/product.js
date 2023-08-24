const express = require("express");
const {
  getAllProducts,
  getSingleProduct,
  getFavProducts,
} = require("../controllers/product");
const { getAccessToRoute } = require("../middlewares/authorization/auth");
const {
  checkProductExist,
} = require("../middlewares/database/databaseErrorHelpers");
const router = express.Router();

router.get("/getAllProducts", getAllProducts);

router.get("/detail/:productId", checkProductExist, getSingleProduct);

router.get("/getFavProducts", getAccessToRoute, getFavProducts);

module.exports = router;
