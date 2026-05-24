# PlaceIQ

PlaceIQ is a unified college placement platform with two interfaces sharing one backend. It provides a Coordinator dashboard for managing listings, companies, and students, and a Student interface for viewing an eligibility-filtered job feed and tracking applications.

## Prerequisites

- Node.js 18 or higher (https://nodejs.org)
- npm 9 or higher
- MongoDB: either local install (https://mongodb.com/try/download) or MongoDB Atlas free tier
- Git

## Clone and install

```bash
git clone <repo-url>
cd placeiq
cd server && npm install
cd ../client && npm install
```

## Environment setup

Create a `.env` file in `server/`:

| Variable | Required | Description | Example / Source | What breaks if missing? |
|---|---|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Connection String | `mongodb://localhost:27017/placeiq` | App crashes on startup |
| `JWT_SECRET` | Yes | Secret key for signing tokens | `supersecretkey` | Auth fails completely |
| `JWT_EXPIRES_IN` | Yes | Token expiration time | `7d` | Tokens might not expire properly |
| `SEED_ADMIN_EMAIL` | Yes | Email for the seed script admin account | `admin@placeiq.com` | Seed script will fail |
| `SEED_ADMIN_PASSWORD` | Yes | Password for the seed script admin | `password123` | Seed script will fail |
| `OPENROUTER_API_KEY` | Optional | Key for JD summarization using OpenRouter | `sk-or-v1-...` | AI summary will show fallback text |
| `TWILIO_SID` | Optional | Twilio account SID for WhatsApp broadcast | `AC...` | WhatsApp broadcast will fail |
| `TWILIO_AUTH` | Optional | Twilio auth token | `auth_token_here` | WhatsApp broadcast will fail |
| `TWILIO_WHATSAPP_FROM` | Optional | Twilio WhatsApp sender number | `whatsapp:+14155238886` | WhatsApp broadcast will fail |
| `EMAIL_USER` | Optional | Nodemailer email user | `noreply@placeiq.in` | Reminder emails won't send |
| `EMAIL_PASS` | Optional | Nodemailer email password | `app_password` | Reminder emails won't send |
| `EMAIL_FROM` | Optional | Nodemailer from address | `noreply@placeiq.in` | Reminder emails won't send |
| `CLIENT_URL` | Yes | Frontend application URL | `http://localhost:3000` | CORS issues or email links broken |

Create a `.env` file in `client/`:

| Variable | Required | Description | Example | What breaks if missing? |
|---|---|---|---|---|
| `REACT_APP_API_URL` | Yes | URL of the backend API | `http://localhost:5000/api` | Frontend cannot communicate with API |

## MongoDB setup — two options

### Option A: Local MongoDB

**macOS:**
```bash
brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community
```

**Ubuntu:**
```bash
sudo apt-get install -y mongodb && sudo systemctl start mongodb
```

**Windows:**
Download the MSI installer from [MongoDB Download Center](https://www.mongodb.com/try/download/community) and follow the installation instructions.

### Option B: MongoDB Atlas (free)
- Create an account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
- Create a free M0 cluster
- Whitelist IP `0.0.0.0/0` for local dev
- Copy the connection string to `MONGODB_URI` in `server/.env`

## Seed the database

```bash
cd server
node scripts/seedAdmin.js
```
This script will:
- Connect to MongoDB using the `MONGODB_URI`.
- Create one admin user with the email and password specified in `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.
- Create one sample college (`anurag.edu.in`).
- Create one coordinator account linked to that college (`coordinator@anurag.edu.in`).
- Create five sample student accounts (`student1@anurag.edu.in` etc).
- Create three sample job listings and a placement cycle.

## Run the app

```bash
# From project root — runs both server and client
cd server && npm run dev
# In a second terminal
cd client && npm start
```
Backend runs at `http://localhost:5000` and frontend at `http://localhost:3000`.

## Default accounts

| Role | Email | Password |
|---|---|---|
| Admin | `SEED_ADMIN_EMAIL` | `SEED_ADMIN_PASSWORD` |
| Coordinator | `coordinator@anurag.edu.in` | `SEED_ADMIN_PASSWORD` |
| Student | `student1@anurag.edu.in` | `SEED_ADMIN_PASSWORD` |

## Optional features

- **AI JD summarization**: Requires `OPENROUTER_API_KEY`. Without it, a fallback message is shown.
- **WhatsApp broadcast**: Requires `TWILIO_SID`, `TWILIO_AUTH`, `TWILIO_WHATSAPP_FROM`. Without it, broadcasts will fail.
- **Email reminders**: Requires `EMAIL_USER`, `EMAIL_PASS`. Without it, daily 8am reminder cron job will fail.

## Project structure

```
placeiq/
├── README.md                         ← full setup and run guide
├── .gitignore
│
├── server/                           ← Express backend
│   ├── package.json
│   ├── .env.example
│   ├── index.js                      ← entry point
│   ├── config/
│   │   └── db.js                     ← MongoDB connection
│   ├── middleware/
│   │   ├── auth.js                   ← JWT verification
│   │   └── requireRole.js            ← RBAC enforcement
│   ├── models/
│   │   ├── User.js
│   │   ├── College.js
│   │   ├── Job.js
│   │   ├── Application.js
│   │   ├── Company.js
│   │   └── PlacementCycle.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── jobs.js
│   │   ├── applications.js
│   │   ├── companies.js
│   │   ├── analytics.js
│   │   └── admin.js
│   ├── services/
│   │   ├── summarise.js              ← OpenRouter API JD summarization
│   │   ├── scraper.js                ← Cheerio Unstop scraper
│   │   ├── broadcast.js              ← Twilio WhatsApp
│   │   └── notify.js                 ← Nodemailer email
│   ├── cron/
│   │   ├── deadlineReminder.js       ← daily 8am reminder emails
│   │   └── urgencyRefresh.js         ← daily urgency score recompute
│   └── scripts/
│       └── seedAdmin.js              ← creates first admin user locally
│
├── client/                           ← React frontend
│   ├── package.json
│   ├── .env.example
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js
│       ├── App.js                    ← role-based routing root
│       ├── context/
│       │   └── AuthContext.js        ← JWT storage and user state
│       ├── api/
│       │   └── axios.js              ← axios instance with base URL + auth header
│       ├── components/
│       │   ├── shared/
│       │   │   ├── Navbar.js
│       │   │   ├── ProtectedRoute.js
│       │   │   └── UpgradeBanner.js  ← shown to coordinator_free on locked features
│       │   ├── coordinator/
│       │   │   ├── Dashboard.js
│       │   │   ├── JobsManager.js
│       │   │   ├── JobForm.js        ← create/edit listing, triggers AI summarize
│       │   │   ├── CompanyCRM.js     ← Kanban: prospect → confirmed → visited → closed
│       │   │   ├── CompanyIntelCard.js
│       │   │   ├── StudentRoster.js
│       │   │   └── Analytics.js      ← paid only
│       │   └── student/
│       │       ├── Feed.js
│       │       ├── JobCard.js        ← AI summary bullets, deadline badge, apply CTA
│       │       ├── Tracker.js        ← Kanban: Applied/OA/Interview/Offer/Rejected
│       │       ├── ApplicationCard.js
│       │       ├── Calendar.js
│       │       └── CompanyIntel.js
│       └── pages/
│           ├── Login.js
│           ├── Register.js
│           ├── CoordinatorApp.js     ← coordinator layout + routes
│           └── StudentApp.js         ← student layout + routes
```

## API reference

| Route | Allowed roles | Method | Request Body / Query | Description |
|---|---|---|---|---|
| `/api/auth/register` | Open | POST | `name`, `email`, `password` | Register coordinator or student |
| `/api/auth/login` | Open | POST | `email`, `password` | Login |
| `/api/auth/me` | All logged in | GET | None | Get current user |
| `/api/jobs` | Student, Coordinator | GET | `?search=` (optional) | Student: filtered feed; Coordinator: all |
| `/api/jobs` | Coordinator | POST | `title`, `company`, `deadline`, etc. | Create listing (free: max 5 active) |
| `/api/jobs/:id/broadcast` | Coordinator Paid | POST | None | Broadcast job to students |
| `/api/jobs/scrape` | Coordinator Paid | POST | `url` | Scrape job listing |
| `/api/analytics/*` | Coordinator Paid | GET | None | Various analytics routes |
| `/api/applications` | Student, Coordinator | GET | Student: own; Coordinator: by jobId | Get applications |
| `/api/applications` | Student | POST | `jobId` | Student applies |
| `/api/applications/:id` | Student | PUT | `stage`, `notes` | Update application stage/notes |
| `/api/admin/*` | Admin | GET, POST, PUT | Admin routes | Provision colleges |

## Common errors and fixes

- `ECONNREFUSED` on MongoDB: MongoDB is not running locally. Make sure the MongoDB service is started, or check your Atlas connection string.
- `401 Unauthorized`: Your JWT token has expired or is invalid. Log out and log in again.
- `403 Forbidden`: You are trying to access a paid feature or a route reserved for another role (like admin). Ensure you are logged in as `coordinator_paid` for features like broadcasting and analytics.
- Port already in use: Another service is running on 3000 or 5000. Change the `PORT` variable in the respective `.env` files.
- Claude / OpenRouter API 401: Invalid or missing API key. The summarizer will show a graceful fallback message instead of throwing an error.

## Running without optional services

You can run PlaceIQ with only MongoDB. All other services (OpenRouter, Twilio, Nodemailer) are optional. The app will start and function without them.
