sabiway-express/
├── package.json
├── server.js                   # Entry point, setup Express + Socket.IO
├── config/
│   └── index.js                # Base URLs, env vars, constants
├── routes/
│   └── accounts.routes.js      # Account API endpoints
│   └── profiles.routes.js
│   └── posts.routes.js 
│   └── notifications.routes.js 
│   └── search.routes.js 
├── controllers/
│   └── accounts.controller.js  # Handles requests, calls services, emits socket events
│   └── profiles.controller.js 
│   └── posts.controller.js
│   └── notifications.controller.js
│   └── search.controller.js
├── services/
│   └── djangoAuth.service.js   # Communicates with Django endpoints
│   └── djangoProfile.service.js
│   └── djangoPost.service.js
│   └── djangoNotification.service.js
│   └── djangoSearch.service.js
├── utils/
│   └── axiosClient.js          # Pre-configured Axios instance
├── middleware/
│   └── authForward.js          # Optional middleware to forward auth headers or verify JWT
└── socket/
    └── socket.js               # Socket.IO setup, event emitter, online users tracking
    └── profileEvents.js  
    └── postEvents.js
    └── notificationEvents.js  
    └── searchEvents.js  
