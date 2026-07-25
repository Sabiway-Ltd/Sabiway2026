# SabiWay Realtime Service (Express + Socket.io)

**Founder & Product Owner**: Johnson Taiwo

Pushes new posts and notifications to connected clients in real time. Node.js + Express + Socket.io. Runs on port 5000. See the root [README.md](../README.md) for how this fits into the four-service architecture, and [../Documentation/V1_Documentation.md](../Documentation/V1_Documentation.md) for the full technical documentation.

This service does not talk to the database directly. It is a thin relay: the Django backend calls its two HTTP endpoints after something happens, and this service fans that out to connected browser clients over WebSocket.

## Setup

```bash
cd ExpressJs
npm install
node server.js
```

## How It Works

1. A browser client connects via Socket.io and emits a `join` event with the user's ID. The server tracks that user's socket connections in an in-memory map (`userSockets`), keyed by user ID, so a notification meant for one user only goes to that user's connected sockets, not everyone.
2. The Django backend, after creating or updating a post, sends a `POST /broadcast` request with the post data. This service re-broadcasts it to **every** connected client via the `new-post` Socket.io event, which is how the community feed updates live without a page refresh.
3. The Django backend, after generating a notification (via the signal handlers described in `../Backend/README.md`), sends a `POST /broadcast-notification` request with the notification and target `userId`. This service emits `new-notification` only to that user's connected sockets.

There is no database, no persistence, and no auth check inside this service. It trusts whatever calls `/broadcast` and `/broadcast-notification`, and trusts whatever userId a client sends in the `join` event. Both of those are worth knowing before extending this service, since they are trust boundaries, not just implementation details.

## Known Issue: Open CORS Policy

```js
const io = new Server(server, {
  cors: {
    origin: "*", // Replace with your frontend domain in production
  },
});
```

The Socket.io CORS policy currently accepts connections from any origin, with a comment in the code already flagging this as needing to change. This is called out in the root README's Known Issues and in the main Technical Documentation. If you are working in this file, restricting `origin` to the actual frontend domain(s) is a small, valuable fix.

## Environment

The `.env` file in this folder is read at deploy time (see `Dockerfile` and `docker-compose.yml`); there is no `.env.example` checked in. Ask whoever holds project accounts for the values currently in use.
