// socket/profileEvents.js
const { emitEvent } = require("./socket");

/* -------------------------
   🧑 Profile Events
--------------------------*/

// When a user updates their own profile
exports.profileUpdated = (profile) => emitEvent("profile:updated", profile);

// When an admin updates a profile by ID
exports.profileUpdatedById = (data) =>
  emitEvent("profile:updatedById", data);

// When a user deletes their own profile
exports.profileDeleted = (data) => emitEvent("profile:deleted", data);

// When an admin deletes a profile by ID
exports.profileDeletedById = (data) =>
  emitEvent("profile:deletedById", data);

/* -------------------------
   🤝 Follow / Unfollow Events
--------------------------*/

// Fired when a user follows another user
exports.userFollowed = (data) => emitEvent("profile:follow", data);

// Fired when a user unfollows another user
exports.userUnfollowed = (data) => emitEvent("profile:unfollow", data);

/* -------------------------
   🏆 Contributor / Ranking
--------------------------*/

// If you have any logic that updates top contributors
exports.topContributorsUpdated = (data) =>
  emitEvent("profile:topContributors", data);
