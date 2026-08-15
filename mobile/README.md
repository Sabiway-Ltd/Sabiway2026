# SabiWay mobile

React Native + Expo client for the shared SabiWay platform.

## Start

1. Copy `.env.example` to `.env.local`.
2. Run `npm ci`.
3. Run `npm start`, `npm run android`, or `npm run ios`.

The mobile app uses the same Django API, database, realtime service, and Django admin as the web application. Do not add client secrets to `EXPO_PUBLIC_*` variables.
