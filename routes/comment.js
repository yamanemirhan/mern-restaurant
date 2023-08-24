const express = require("express");
const { deleteComment } = require("../controllers/comment");
const { getAccessToRoute } = require("../middlewares/authorization/auth");
const {
  checkCommentExist,
} = require("../middlewares/database/databaseErrorHelpers");

const router = express.Router();

router.delete(
  "/:commentId",
  getAccessToRoute,
  checkCommentExist,
  deleteComment
);
module.exports = router;
