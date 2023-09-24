const express = require("express");
const {
  createOrder,
  fetchUserOrders,
  deleteOrder,
  fetchSellerOrders,
  updateOrder,
  addComment,
} = require("../controllers/order");
const { getAccessToRoute } = require("../middlewares/authorization/auth");

const router = express.Router();

router.post("/create", getAccessToRoute, createOrder);
router.get("/own", getAccessToRoute, fetchUserOrders);
router.delete("/delete/:id", getAccessToRoute, deleteOrder);
router.get("/seller", getAccessToRoute, fetchSellerOrders);
router.put("/update/:id", getAccessToRoute, updateOrder);
router.post("/addreview/:productId/:orderId", getAccessToRoute, addComment);

module.exports = router;
