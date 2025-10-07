"use client";

import { useEffect } from "react";
import { useProfileStore } from "../store/useProfileStore";

export default function ProfilePage() {
  const { profile, getMyProfile, loading } = useProfileStore();

  useEffect(() => {
    getMyProfile();
  }, [getMyProfile]);

  if (loading) return <p>Loading...</p>;
  if (!profile) return <p>No profile found.</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">{profile.full_name}</h1>
      <p>{profile.username}</p>
      <p>{profile.email}</p>
      <p>Followers: {profile.followers_count}</p>
      <p>Following: {profile.following_count}</p>
    </div>
  );
}
