import { useAuthStore } from "@/lib/store/authStore";

export default function OnlineUsers() {
  const { onlineUsers } = useAuthStore();

  return (
    <div>
      <h3>🟢 Online Users</h3>
      <ul>
        {onlineUsers.map((user) => (
          <li key={user.id}>{user.full_name}</li>
        ))}
      </ul>
    </div>
  );
}
