import React, { useState, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";

const ProfilePage = () => {
  const { user, fetchProfile, updateProfile, message } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName || "");

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName);
  }, [user]);

  const handleUpdate = () => {
    updateProfile(fullName);
  };

  return (
    <div>
      <h2>My Profile</h2>
      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" />
      <button onClick={handleUpdate}>Update</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default ProfilePage;
