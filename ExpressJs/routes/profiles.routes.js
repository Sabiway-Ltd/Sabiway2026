// routes/profiles.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/profiles.controller");

/* ================================================
   🧑‍🤝‍🧑 Profiles
   ================================================= */

// 🔹 Get all profiles
router.get("/", controller.getAllProfiles);

// 🔹 Get top contributors
router.get("/contributors/top", controller.getTopContributors);

/* ================================================
   👤 Current (Authenticated) User
   ================================================= */

// 🔹 Current user's profile
router.get("/me", controller.getMyProfile);
router.put("/me", controller.updateProfile);
router.patch("/me", controller.partialUpdateProfile);
router.delete("/me", controller.deleteMyProfile);

// 🔹 Current user's followers & following
router.get("/me/followers", controller.getMyFollowers);
router.get("/me/following", controller.getMyFollowing);

/* ================================================
   👥 Specific User by ID
   ================================================= */

// 🔹 Profile CRUD by user ID
router.get("/:userId", controller.getProfileById);
router.put("/:userId", controller.updateProfileById);
router.patch("/:userId", controller.partialUpdateProfileById);
router.delete("/:userId", controller.deleteProfileById);

// 🔹 Followers / Following by user
router.get("/:userId/followers", controller.getFollowers);
router.get("/:userId/following", controller.getFollowing);

// 🔹 Follow / Unfollow actions
router.post("/:userId/follow", controller.followUser);
router.post("/:userId/unfollow", controller.unfollowUser);

module.exports = router;
