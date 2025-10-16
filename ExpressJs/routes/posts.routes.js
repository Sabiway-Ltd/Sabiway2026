// routes/posts.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/posts.controller");
const multer = require("multer");
const upload = multer();

// Posts CRUD + list
router.get("/", controller.listPosts);               // optional listing / pagination
router.post("/", upload.single("image"), controller.createPost);
router.get("/:id", controller.getPostById);
router.put("/:id", controller.updatePost);
router.delete("/:id", controller.deletePost);

// Like / Unlike (post)
router.post("/:id/like", controller.likePost);
router.post("/:id/unlike", controller.unlikePost);

// Comments (list + create on post)
router.get("/:id/comments", controller.getCommentsForPost);
router.post("/:id/comments", controller.createCommentForPost);

// Replies for a post (all replies belonging to comments under the post)
router.get("/:id/replies", controller.listRepliesForPost);
// Create reply on a comment
router.post("/replies", controller.createReplyForComment);
router.get("/comments/:id/replies", controller.getRepliesByComment);



// Comment like/unlike (by comment id)
router.post("/comments/:id/like", controller.likeComment);
router.post("/comments/:id/unlike", controller.unlikeComment);

// Reply like/unlike (by reply id)
router.post("/replies/:id/like", controller.likeReply);
router.post("/replies/:id/unlike", controller.unlikeReply);

// Bookmark / Unbookmark
router.post("/:id/bookmark", controller.bookmarkPost);
router.post("/:id/unbookmark", controller.unbookmarkPost);
router.get("/me/bookmarks", controller.myBookmarks);

// Repost / Unrepost / My reposts
router.post("/:id/repost", controller.repost);
router.delete("/:id/repost/:repost_id", controller.unrepost);
router.get("/me/reposts", controller.myReposts);

// Trending hashtags
router.get("/hashtags/trending", controller.trendingHashtags);
router.get("/hashtags", controller.listHashtags); // optional list

// My posts
router.get("/me", controller.myPosts);

// Router-level mounts for comments/replies/likes/reposts endpoints (if needed)
module.exports = router;
