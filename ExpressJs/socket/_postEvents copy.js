// socket/postEvents.js
const { emitEvent } = require("./socket");

/* -------------------------
   🟢 Post Events
--------------------------*/
exports.postCreated = (post) => emitEvent("post:created", post);
exports.postUpdated = (post) => emitEvent("post:updated", post);
exports.postDeleted = (data) => emitEvent("post:deleted", data);

exports.postLiked = (data) => emitEvent("post:liked", data);
exports.postUnliked = (data) => emitEvent("post:unliked", data);

exports.postBookmarked = (data) => emitEvent("post:bookmarked", data);
exports.postUnbookmarked = (data) => emitEvent("post:unbookmarked", data);

exports.reposted = (data) => emitEvent("post:reposted", data);
exports.unreposted = (data) => emitEvent("post:unreposted", data);

/* -------------------------
   💬 Comment Events
--------------------------*/
exports.commentCreated = (data) => emitEvent("comment:created", data);
exports.commentLiked = (data) => emitEvent("comment:liked", data);
exports.commentUnliked = (data) => emitEvent("comment:unliked", data);

/* -------------------------
   💬 Reply Events
--------------------------*/
exports.replyLiked = (data) => emitEvent("reply:liked", data);
exports.replyUnliked = (data) => emitEvent("reply:unliked", data);
