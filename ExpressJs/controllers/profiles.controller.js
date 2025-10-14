// controllers/profiles.controller.js
const djangoProfileService = require("../services/djangoProfile.service");
const profileEvents = require("../socket/profileEvents");

/* 🔹 Helper for error handling */
const handleError = (res, err) => {
  res
    .status(err.response?.status || 500)
    .json(err.response?.data || { error: err.message });
};

/* ===============================
   🧑‍🤝‍🧑 Profile Retrieval
   =============================== */

exports.getAllProfiles = async (req, res) => {
  try {
    const token = req.headers._token;
    const profiles = await djangoProfileService.getAllProfiles(token);
    res.json(profiles);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const token = req.headers._token;
    const profile = await djangoProfileService.getMyProfile(token);
    res.json(profile);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getProfileById = async (req, res) => {
  try {
    const token = req.headers._token;
    const profile = await djangoProfileService.getProfileById(
      token,
      req.params.userId
    );
    res.json(profile);
  } catch (err) {
    handleError(res, err);
  }
};

/* ===============================
   ✏️ Profile Update / Delete
   =============================== */

exports.updateProfile = async (req, res) => {
  try {
    const token = req.headers._token;
    const updated = await djangoProfileService.updateProfile(token, req.body);

    profileEvents.profileUpdated(updated);
    res.json(updated);
  } catch (err) {
    handleError(res, err);
  }
};

exports.partialUpdateProfile = async (req, res) => {
  try {
    const token = req.headers._token;
    const updated = await djangoProfileService.partialUpdateProfile(
      token,
      req.body
    );

    profileEvents.profileUpdated(updated);
    res.json(updated);
  } catch (err) {
    handleError(res, err);
  }
};

exports.deleteMyProfile = async (req, res) => {
  try {
    const token = req.headers._token;
    const result = await djangoProfileService.deleteMyProfile(token);

    profileEvents.profileDeleted({ user: req.user });
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
};

// By ID variants (admin or privileged)
exports.updateProfileById = async (req, res) => {
  try {
    const token = req.headers._token;
    const updated = await djangoProfileService.updateProfileById(
      token,
      req.params.userId,
      req.body
    );

    profileEvents.profileUpdatedById(updated);
    res.json(updated);
  } catch (err) {
    handleError(res, err);
  }
};

exports.partialUpdateProfileById = async (req, res) => {
  try {
    const token = req.headers._token;
    const updated = await djangoProfileService.partialUpdateProfileById(
      token,
      req.params.userId,
      req.body
    );

    profileEvents.profileUpdatedById(updated);
    res.json(updated);
  } catch (err) {
    handleError(res, err);
  }
};

exports.deleteProfileById = async (req, res) => {
  try {
    const token = req.headers._token;
    const result = await djangoProfileService.deleteProfileById(
      token,
      req.params.userId
    );

    profileEvents.profileDeletedById({ userId: req.params.userId });
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
};

/* ===============================
   👥 Followers / Following
   =============================== */

exports.getFollowers = async (req, res) => {
  try {
    const token = req.headers._token;
    const data = await djangoProfileService.getFollowers(
      token,
      req.params.userId
    );
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const token = req.headers._token;
    const data = await djangoProfileService.getFollowing(
      token,
      req.params.userId
    );
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getMyFollowers = async (req, res) => {
  try {
    const token = req.headers._token;
    const data = await djangoProfileService.getMyFollowers(token);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getMyFollowing = async (req, res) => {
  try {
    const token = req.headers._token;
    const data = await djangoProfileService.getMyFollowing(token);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
};

/* ===============================
   🤝 Follow / Unfollow
   =============================== */

exports.followUser = async (req, res) => {
  try {
    const token = req.headers._token;
    const result = await djangoProfileService.followUser(
      token,
      req.params.userId
    );

    profileEvents.userFollowed({
      targetUserId: req.params.userId,
      follower: req.user,
    });

    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const token = req.headers._token;
    const result = await djangoProfileService.unfollowUser(
      token,
      req.params.userId
    );

    profileEvents.userUnfollowed({
      targetUserId: req.params.userId,
      follower: req.user,
    });

    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
};

/* ===============================
   🏆 Top Contributors
   =============================== */

exports.getTopContributors = async (req, res) => {
  try {
    const token = req.headers._token;
    const contributors = await djangoProfileService.getTopContributors(token);

    profileEvents.topContributorsUpdated(contributors);
    res.json(contributors);
  } catch (err) {
    handleError(res, err);
  }
};
