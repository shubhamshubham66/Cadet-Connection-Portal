# CCP Backend — MongoDB API

Node.js/Express backend with MongoDB Atlas for the NCC Cadet Connection Portal.

## Setup

1. Create a MongoDB Atlas cluster at https://cloud.mongodb.com
2. Copy `.env.example` to `.env` and fill in your values:
   ```
   cp .env.example .env
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Seed the database with default admin and battalions:
   ```
   node seed.js
   ```
5. Start the server:
   ```
   npm start
   ```

## Default Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Main Admin | admin@ccp.com | Admin@123 |
| BN Admin | bnadmin@ccp.com | Bn@admin1 |
| College Admin | collegeadmin@ccp.com | College@1 |

## API Endpoints

### Auth
- `POST /api/auth/register` — Cadet registration
- `POST /api/auth/cadet-login` — Cadet login
- `POST /api/auth/admin-login` — Admin login
- `GET /api/auth/me` — Get current user (requires token)

### Cadets (Role-Based)
- `GET /api/cadets` — Get cadets (filtered by admin role)
- `GET /api/cadets/:id` — Get single cadet
- `PATCH /api/cadets/:id/status` — Approve/Reject cadet
- `GET /api/cadets/stats/overview` — Get stats

### Battalions
- `GET /api/battalions` — List all (public)
- `POST /api/battalions` — Create (MainAdmin only)

### Institutes
- `GET /api/institutes` — List all (public)
- `POST /api/institutes` — Create (MainAdmin/BnAdmin)

## Role-Based Data Visibility

| Role | What they see |
|------|--------------|
| **MainAdmin** | ALL cadets — no filter |
| **BnAdmin** | Only cadets where `battalion` matches their assigned battalion |
| **CollegeAdmin** | Only cadets where `institute` matches their assigned institute |

This filtering happens at the MongoDB query level in `routes/cadets.js`.

## Deployment

Deploy to Render, Railway, or any Node.js hosting:
1. Set environment variables
2. Start command: `npm start`
3. Update `API.BASE_URL` in `assets/js/api.js` with your deployed URL
