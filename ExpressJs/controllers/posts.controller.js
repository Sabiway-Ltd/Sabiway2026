// controllers/posts.controller.js
const djangoPost = require("../services/djangoPost.service");
const postEvents = require("../socket/postEvents");

/**
 * Helpers:
 * - token: forwarded by middleware into req.headers._token
 * - req.user is optional (only if you decode token in middleware)
 */


exports.listPosts = async (req, res) => {
  try {
    const token = req.headers._token;
    const { page = 1, page_size = 20 } = req.query;
    const data = await djangoPost.listPosts(token, { page, page_size });
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};



exports.createPost = async (req, res) => {
  try {
    const token = req.headers._token;
    const created = await djangoPost.createPost(token, { content: req.body.content }, req.file);

    // broadcast post created to all users
    postEvents.postCreated(created);

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: err.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const token = req.headers._token;
    const updated = await djangoPost.updatePost(token, req.params.id, req.body, req.files);
    postEvents.postUpdated(updated);
    res.json(updated);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const token = req.headers._token;
    await djangoPost.deletePost(token, req.params.id);
    postEvents.postDeleted({ id: req.params.id });
    res.status(204).send();
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const token = req.headers._token;
    const post = await djangoPost.getPostById(token, req.params.id);
    res.json(post);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};

/* -------------------------
   Likes (post)
   ------------------------- */
// Like Post
exports.likePost = async (req, res) => {
  try {
    const token = req.headers._token;
    const updated = await djangoPost.likePost(token, req.params.id);

    // Map server response to { likes } format
    const payload = { postId: req.params.id, result: { likes: updated.likes_count } };

    postEvents.postLiked(payload);

    res.json(updated);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};

// Unlike Post
exports.unlikePost = async (req, res) => {
  try {
    const token = req.headers._token;
    const updated = await djangoPost.unlikePost(token, req.params.id);

    const payload = { postId: req.params.id, result: { likes: updated.likes_count } };

    postEvents.postUnliked(payload);

    res.json(updated);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};


/* -------------------------
   Comments & Replies
   ------------------------- */
exports.getCommentsForPost = async (req, res) => {
  try {
    const token = req.headers._token;
    const comments = await djangoPost.getCommentsForPost(token, req.params.id);
    res.json(comments);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};



exports.createCommentForPost = async (req, res) => {
  try {
    const token = req.headers._token;

    // Use multer for file upload: req.file will be the uploaded image
    const created = await djangoPost.createCommentForPost(
      token,
      req.params.id,
      { content: req.body.content },
      req.file // new
    );

    postEvents.commentCreated({ postId: req.params.id, comment: created });
    res.status(201).json(created);
  } catch (err) {
    console.error("createCommentForPost error:", err.response?.data || err.message);
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: err.message });
  }
};

exports.createReplyForComment = async (req, res) => {
  try {
    const token =
      req.headers._token || req.headers.authorization?.split(" ")[1];
    const { comment, content } = req.body;

    if (!comment) {
      return res.status(400).json({ error: "Comment ID is required" });
    }

    const created = await djangoPost.createReplyForComment(
      token,
      { comment, content },
      req.file // new
    );

    postEvents.replyCreated({
      commentId: comment,
      reply: created,
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("createReplyForComment error:", err.response?.data || err.message);
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: err.message });
  }
};


exports.listRepliesForPost = async (req, res) => {
  try {
    const token = req.headers._token;
    const replies = await djangoPost.listRepliesForPost(token, req.params.id);
    res.json(replies);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};

/* -------------------------
   🔁 Replies (NEW)
   ------------------------- */
exports.getRepliesByComment = async (req, res) => {
  try {
    const token = req.headers._token;
    const replies = await djangoPost.getRepliesByComment(token, req.params.id);
    res.json(replies);
  } catch (err) {
    console.error("getRepliesByComment error:", err);
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: err.message });
  }
};






/* Comment like/unlike */
exports.likeComment = async (req, res) => {
  try {
    const token = req.headers._token;
    const data = await djangoPost.likeComment(token, req.params.id);
    postEvents.commentLiked({ commentId: req.params.id, actor: req.user || null, data });
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};

exports.unlikeComment = async (req, res) => {
  try {
    const token = req.headers._token;
    const data = await djangoPost.unlikeComment(token, req.params.id);
    postEvents.commentUnliked({ commentId: req.params.id, actor: req.user || null, data });
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};

/* Reply like/unlike */
exports.likeReply = async (req, res) => {
  try {
    const token = req.headers._token;
    const data = await djangoPost.likeReply(token, req.params.id);
    postEvents.replyLiked({ replyId: req.params.id, actor: req.user || null, data });
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};

exports.unlikeReply = async (req, res) => {
  try {
    const token = req.headers._token;
    const data = await djangoPost.unlikeReply(token, req.params.id);
    postEvents.replyUnliked({ replyId: req.params.id, actor: req.user || null, data });
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};

/* Bookmarks */
exports.bookmarkPost = async (req, res) => {
  try {
    const token = req.headers._token;
    const created = await djangoPost.bookmarkPost(token, req.params.id);
    postEvents.postBookmarked({ postId: req.params.id, bookmark: created });
    res.status(201).json(created);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};

exports.unbookmarkPost = async (req, res) => {
  try {
    const token = req.headers._token;
    const data = await djangoPost.unbookmarkPost(token, req.params.id);
    postEvents.postUnbookmarked({ postId: req.params.id });
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};

exports.myBookmarks = async (req, res) => {
  try {
    const token = req.headers._token;
    const data = await djangoPost.myBookmarks(token);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};

/* Repost */
exports.repost = async (req, res) => {
  try {
    const token = req.headers._token;
    const created = await djangoPost.repost(token, req.params.id, req.body);
    postEvents.reposted({ postId: req.params.id, repost: created });
    res.status(201).json(created);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};

exports.unrepost = async (req, res) => {
  try {
    const token = req.headers._token;
    await djangoPost.unrepost(token, req.params.id, req.params.repost_id);
    postEvents.unreposted({ postId: req.params.id, repostId: req.params.repost_id });
    res.status(204).send();
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};

exports.myReposts = async (req, res) => {
  try {
    const token = req.headers._token;
    const data = await djangoPost.myReposts(token);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};

/* Hashtags */
exports.trendingHashtags = async (req, res) => {
  try {
    const token = req.headers._token;
    const data = await djangoPost.trendingHashtags(token);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};

exports.listHashtags = async (req, res) => {
  try {
    const token = req.headers._token;
    const data = await djangoPost.listHashtags(token);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};

/* My posts */
exports.myPosts = async (req, res) => {
  try {
    const token = req.headers._token;
    const posts = await djangoPost.myPosts(token);
    res.json(posts);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};


exports.userPosts = async (req, res) => {
  try {
    const token = req.headers._token;
    const username = req.params.username;
    const { page = 1, page_size = 20 } = req.query;
    const data = await djangoPost.userPosts(token, username, { page, page_size });
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
};

