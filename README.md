# BasicVids Client

Vue frontend for the BasicVids microservice system.

During development, Vite proxies API routes to the shared gateway:

```text
http://localhost:8080
```

For a deployed build served from another host, override it with:

```bash
VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

## Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Current Routes

| Feature | Gateway route |
| ------- | ------------- |
| Auth login | `/api/v1/auth/login/` |
| Current user | `/api/v1/users/detail/` |
| Video list | `/api/v1/videos/` |
| Video upload | `/api/v1/videos/uploads/` |

Future microservices should be added behind the gateway and then wired into `src/api.js`.
