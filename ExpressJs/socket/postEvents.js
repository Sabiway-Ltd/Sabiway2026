let io = null;

exports.initSocket = (ioInstance) => {
  io = ioInstance;
};

const broadcastEvent = (event, data) => {
  if (!io) {
    console.warn("Socket.IO not initialized. Event not emitted:", event);
    return;
  }
  io.emit(event, data);
};

/* -------------------------
   🟢 Post Events
--------------------------*/
exports.postCreated = (post) => broadcastEvent("post:created", post);
exports.postUpdated = (post) => broadcastEvent("post:updated", post);
exports.postDeleted = (data) => broadcastEvent("post:deleted", data);

exports.postLiked = (data) => broadcastEvent("post:liked", data);
exports.postUnliked = (data) => broadcastEvent("post:unliked", data);

exports.postBookmarked = (data) => broadcastEvent("post:bookmarked", data);
exports.postUnbookmarked = (data) => broadcastEvent("post:unbookmarked", data);

exports.reposted = (data) => broadcastEvent("post:reposted", data);
exports.unreposted = (data) => broadcastEvent("post:unreposted", data);

/* -------------------------
   💬 Comment Events
--------------------------*/
exports.commentCreated = (data) => broadcastEvent("comment:created", data);
exports.commentLiked = (data) => broadcastEvent("comment:liked", data);
exports.commentUnliked = (data) => broadcastEvent("comment:unliked", data);

/* -------------------------
   💭 Reply Events
--------------------------*/
exports.replyCreated = (data) => broadcastEvent("reply:created", data);
exports.replyLiked = (data) => broadcastEvent("reply:liked", data);
exports.replyUnliked = (data) => broadcastEvent("reply:unliked", data);
