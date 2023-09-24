const express = require("express");
const auth = require("./auth");
const user = require("./user");
const seller = require("./seller");
const product = require("./product");
const order = require("./order");
const comment = require("./comment");

const router = express.Router();

router.use("/auth", auth);
router.use("/user", user);
router.use("/product", product);
router.use("/seller", seller);
router.use("/order", order);
router.use("/comment", comment);

module.exports = router;
