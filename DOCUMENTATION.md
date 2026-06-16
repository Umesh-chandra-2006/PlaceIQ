# PlaceIQ — Technical Documentation

> Last updated: June 14, 2026 · Version 2.0

This document is the comprehensive technical reference for PlaceIQ — a multi-tenant, role-based college placement management platform built on the MERN stack.

---

## 1. Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | Core UI framework with lazy-loaded routes |
| React Router v6 | Client-side routing with role-based guards |
| Tailwind CSS v3 | Utility-first styling (custom `zinc` + `emerald` palette) |
| Lucide React | Modern SVG iconography |
| Axios | HTTP client with 401 interceptor + auto-logout |
| react-hot-toast | Global toast notification system |
| Context API | Auth state (`AuthContext`), theming (`ThemeContext`) |

### Backend
| Technology | Purpose |
|---|---|
| Node.js 18+ & Express.js | API server |
| MongoDB & Mongoose | Database with indexed schemas + connection pooling |
| JWT (jsonwebtoken) | Stateless authentication with 7-day expiry |
| bcryptjs | Password hashing (10-round salt) |
| Helmet.js | Security headers (CSP, HSTS, X-Frame-Options, etc.) |
| express-rate-limit | Rate limiting on authentication endpoints |
| Cloudinary | Cloud-based file storage (resumes, offer letters) |
| node-cron | Scheduled background jobs |

### Microservices & Integrations
| Service | Purpose |
|---|---|
| ScrapeGraphAI (Python/FastAPI) | LLM-powered web scraping of job descriptions |
| OpenRouter API (Nvidia Nemotron) | AI-driven JD summarization + student resume deep-review |
| Twilio API | WhatsApp broadcasting for urgent announcements |
| Nodemailer | Automated email: deadline reminders, setup links, password resets |

### DevOps & Tooling
| Tool | Purpose |
|---|---|
| Docker + docker-compose | Containerized deployment (3 services: server, scraper, mongodb) |
| GitHub Actions CI | Automated testing pipeline |
| ESLint + Prettier | Code quality and formatting |
| Jest + Supertest | Backend test suite (22 tests across 6 suites) |

---

## 2. Architecture Overview

### Multi-Tenant Isolation
Every data query is scoped by `collegeId`, ensuring complete data isolation between institutions. Cache keys are also college-scoped to prevent data leakage.

### Middleware Stack
Requests flow through a layered middleware chain:

```
Request → Helmet → CORS → Rate Limiter → JWT Auth (protect)
        → Role Check (requireRole) → Onboarding Gate (enforceOnboarding)
        → Pagination (paginate) → Cache (cacheMiddleware)
        → Route Handler → Audit Logger → Response
```

| Middleware | File | Purpose |
|---|---|---|
| `protect` | `middleware/auth.js` | JWT verification, attaches `req.user` |
| `requireRole(...)` | `middleware/requireRole.js` | Role-based authorization gate |
| `enforceOnboarding` | `middleware/onboarded.js` | Blocks students who haven't completed profile setup |
| `paginate()` | `middleware/paginate.js` | Parses `?page=&limit=`, attaches `req.pagination` |
| `cacheMiddleware(ttl)` | `middleware/cache.js` | In-memory response cache, college-scoped |
| `logAudit(...)` | `middleware/auditLogger.js` | Writes audit trail to `AuditLog` collection |
| `validate(schema)` | `middleware/validate.js` | Request body validation |

### Pagination Response Format
All paginated endpoints return:
```json
{
  "total": 142,
  "page": 1,
  "limit": 20,
  "pages": 8,
  "data": [...]
}
```

---

## 3. Role-Based Access Control

### Roles & Hierarchy
| Role | Scope | Provisioned By |
|---|---|---|
| `superadmin` | Platform-wide | Seed script |
| `admin` | Single college | Super Admin |
| `coordinator` | Single college (free/paid tiers) | College Admin |
| `student` | Single college, single batch | Coordinator |

### Role Constants
Defined in `server/config/constants.js`:
```javascript
ROLES: { SUPERADMIN, ADMIN, COORDINATOR, STUDENT }
ALLOWED_FILE_EXTENSIONS: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
PAGINATION_DEFAULTS: { DEFAULT_LIMIT: 20, MAX_LIMIT: 100 }
```

### Coordinator Tiers
| Feature | Free (`coordinator_free`) | Paid (`coordinator_paid`) |
|---|---|---|
| Job postings | 5 max active | Unlimited |
| AI summarization | ✅ | ✅ |
| Company CRM | ✅ | ✅ |
| Analytics dashboard | ❌ | ✅ |
| WhatsApp broadcasts | ❌ | ✅ |
| Automated scraping | ❌ | ✅ |

---

## 4. Database Schemas

### `User`
| Field | Type | Notes |
|---|---|---|
| `name`, `email` | String | `email` indexed, unique |
| `passwordHash` | String | bcrypt hashed |
| `role` | String | `superadmin`, `admin`, `coordinator`, `student` |
| `subRole` | String | `coordinator_free`, `coordinator_paid` |
| `collegeId` | ObjectId | Tenant scoping |
| `isSetup` | Boolean | Account activation status |
| `setupToken`, `setupTokenExpires` | String, Date | Magic link provisioning |
| `resetPasswordToken`, `resetPasswordExpires` | String, Date | Password reset flow |
| `mustChangePassword` | Boolean | Forces first-login password change (students) |
| `isOnboarded` | Boolean | Profile completion flag (students) |
| `aiReviewsUsed`, `aiReviewsResetDate` | Number, Date | Rolling 30-day AI quota tracking |
| `branch`, `year`, `cgpa`, `backlogs`, `phone` | Mixed | Student-specific profile fields |
| `resumeUrl` | String | Cloudinary URL |
| **Indexes** | | `{collegeId, role}`, `{email}`, `{setupToken}`, `{resetPasswordToken}` |

### `Job`
| Field | Type | Notes |
|---|---|---|
| `title`, `company`, `location`, `description` | String | Core job details |
| `jobType` | Enum | `fulltime`, `internship`, `ppo` |
| `aiSummary` | [String] | OpenRouter-generated bullet points |
| `eligibility` | Object | `{ branches, minCgpa, maxBacklogs, batchYears }` |
| `deadline` | Date | Auto-close via cron |
| `urgencyScore` | Number | Computed daily by cron |
| `status` | Enum | `draft`, `active`, `closed` |
| **Indexes** | | `{collegeId, status}`, `{deadline}`, `{createdAt}` |

### `Application`
| Field | Type | Notes |
|---|---|---|
| `studentId`, `jobId`, `collegeId` | ObjectId | Foreign keys |
| `stage` | Enum | `applied`, `oa`, `interview`, `offer`, `rejected` |
| `stageHistory` | [{stage, changedAt}] | Full audit trail of stage movements |
| `interviewRounds` | [{roundNumber, type, scheduledAt, status, feedback}] | Structured interview tracking |
| `offerLetterUrl` | String | Cloudinary URL for verified offers |
| `offerStatus` | Enum | `none`, `uploaded`, `verified`, `rejected` |
| `notes` | String | Student-editable notes |
| **Indexes** | | `{studentId}`, `{jobId}`, `{collegeId, stage}` |

### `College`
| Field | Type | Notes |
|---|---|---|
| `name`, `emailDomain` | String | Institution identity |
| `licenceStatus` | Enum | `free`, `paid`, `expired` |
| `departments` | [String] | Configured by admin |
| `cgpaScale` | Number | 5 or 10 |
| `aiReviewQuota` | Number | Monthly AI reviews per student (default: 3) |
| `isActive`, `isDeleted` | Boolean | Soft-delete + activation toggle |

### `Batch`
| Field | Type | Notes |
|---|---|---|
| `name`, `year`, `department` | Mixed | Cohort identity |
| `collegeId`, `createdBy` | ObjectId | Ownership |
| `students` | [ObjectId] | Enrolled student references |

### `Company` (CRM)
| Field | Type | Notes |
|---|---|---|
| `name`, `status` | String | Kanban stages: `prospect` → `confirmed` → `visited` → `closed` |
| `publicData` | Object | `avgCtc`, `employeeRange`, `industry`, `glassdoorRating` |
| `historicalData` | Array | Year-over-year: `cycleYear`, `ctcOffered`, `offersCount`, `branches` |

### `AuditLog`
| Field | Type | Notes |
|---|---|---|
| `userId`, `collegeId` | ObjectId | Actor + tenant |
| `action` | String | e.g., `JOB_CREATED`, `APPLICATION_STAGE_CHANGED` |
| `target`, `targetId` | String, ObjectId | What was acted upon |
| `details` | Object | Freeform metadata |
| `createdAt` | Date | Auto-expires after 90 days (TTL index) |

### Additional Models
- **`Notification`** — In-app notification feed with read/unread status
- **`Announcement`** — Coordinator-to-student broadcasts with read tracking
- **`AtsScore`** — Cached ATS match scores per student-job pair
- **`PlacementCycle`** — Historical placement statistics per college
- **`ScraperSource`** — Tracked URLs for automated scraping

---

## 5. API Reference — 65 Endpoints

All protected routes require `Authorization: Bearer <token>` header.

### Authentication (`/api/auth`) — 8 endpoints

| Method | Route | Description | Access | Middleware |
|---|---|---|---|---|
| `POST` | `/login` | Authenticate user, return JWT | Public | Rate limited |
| `GET` | `/setup-verify` | Verify setup token validity | Public | — |
| `POST` | `/setup-complete` | Complete account activation (set password) | Public | Rate limited |
| `GET` | `/me` | Get current authenticated user | Authenticated | `protect` |
| `GET` | `/college` | Get user's college config | Authenticated | `protect`, `cache(300s)` |
| `PUT` | `/change-password` | Change password (requires old password) | Authenticated | `protect` |
| `POST` | `/forgot-password` | Generate reset token + send email | Public | Rate limited |
| `POST` | `/reset-password` | Reset password with token | Public | Rate limited |

### Admin (`/api/admin`) — 11 endpoints

| Method | Route | Description | Access |
|---|---|---|---|
| `POST` | `/colleges` | Create college + provision admin | Superadmin |
| `GET` | `/colleges` | List all colleges | Superadmin |
| `PUT` | `/colleges/:id/upgrade` | Update licence status / AI quota | Superadmin |
| `DELETE` | `/colleges/:id` | Soft-delete college | Superadmin |
| `POST` | `/colleges/:id/regenerate-setup` | Regenerate admin setup link | Superadmin |
| `PUT` | `/colleges/:id/toggle-active` | Toggle college active status | Superadmin |
| `GET` | `/college-settings` | Get college config | Admin |
| `PUT` | `/college-settings` | Update departments / CGPA scale | Admin |
| `POST` | `/coordinators` | Provision a coordinator | Admin |
| `GET` | `/coordinators` | List college coordinators | Admin |
| `POST` | `/upgrade-simulation` | Simulate plan upgrade (dev) | Superadmin/Admin |

### Jobs (`/api/jobs`) — 8 endpoints

| Method | Route | Description | Access |
|---|---|---|---|
| `GET` | `/` | List jobs (students see eligible only + ATS matchScore) | Authenticated |
| `POST` | `/` | Create job posting | Coordinator |
| `PUT` | `/:id` | Update job details/status | Coordinator |
| `DELETE` | `/:id` | Delete job | Coordinator |
| `POST` | `/:id/summarise` | AI-summarise job description | Coordinator |
| `POST` | `/scrape` | Scrape job from Unstop URL | Coordinator (Paid) |
| `POST` | `/:id/broadcast` | WhatsApp broadcast to eligible students | Coordinator (Paid) |
| `POST` | `/:id/ai-review` | AI resume deep-review against JD | Student (Onboarded) |

### Applications (`/api/applications`) — 7 endpoints

| Method | Route | Description | Access |
|---|---|---|---|
| `GET` | `/` | List applications (paginated) | Authenticated |
| `POST` | `/` | Apply to a job | Student (Onboarded) |
| `PUT` | `/:id` | Update stage (optimistic concurrency) / notes | Student/Coordinator |
| `POST` | `/:id/rounds` | Schedule interview round | Coordinator |
| `PUT` | `/:id/rounds/:roundId` | Update interview round status | Coordinator |
| `PUT` | `/:id/offer-upload` | Upload offer letter (Cloudinary) | Student (Onboarded) |
| `PUT` | `/:id/offer-verify` | Verify/reject offer letter | Coordinator |

### Batches (`/api/batches`) — 8 endpoints

| Method | Route | Description | Access |
|---|---|---|---|
| `GET` | `/` | List batches (paginated) | Coordinator |
| `POST` | `/` | Create a new batch | Coordinator |
| `GET` | `/:id/students` | List students (search + filter + paginate) | Coordinator |
| `POST` | `/:id/students` | Bulk import students via CSV | Coordinator |
| `POST` | `/:id/students/single` | Add single student | Coordinator |
| `PUT` | `/students/:id/status` | Toggle student active/inactive | Coordinator |
| `POST` | `/students/:id/send-login` | Email login credentials to student | Coordinator |
| `DELETE` | `/:id/students/:studentId` | Remove student + cancel pending apps | Coordinator |

### Students (`/api/students`) — 4 endpoints

| Method | Route | Description | Access |
|---|---|---|---|
| `POST` | `/onboard` | Complete onboarding (profile + resume upload) | Student |
| `GET` | `/me` | Get current student profile | Authenticated |
| `GET` | `/college-config` | Get college departments + CGPA scale | Authenticated |
| `PUT` | `/profile` | Update student profile | Student (Onboarded) |

### Companies (`/api/companies`) — 4 endpoints

| Method | Route | Description | Access |
|---|---|---|---|
| `GET` | `/` | List companies (cached 60s, paginated) | Authenticated |
| `POST` | `/` | Create company record | Coordinator |
| `GET` | `/:id/intel` | Get company details/intel | Authenticated |
| `PUT` | `/:id` | Update company CRM data | Coordinator |

### Analytics (`/api/analytics`) — 6 endpoints

| Method | Route | Description | Access |
|---|---|---|---|
| `GET` | `/overview` | Placement overview stats | Coordinator/Admin |
| `GET` | `/pipeline` | Application funnel breakdown | Coordinator (Paid) |
| `GET` | `/branch` | Branch-wise placement stats | Coordinator (Paid) |
| `GET` | `/at-risk` | At-risk unplaced students | Coordinator (Paid) |
| `GET` | `/ats-distribution` | ATS score distribution buckets | Coordinator (Paid) |
| `GET` | `/activity-heatmap` | Daily application activity (30 days) | Coordinator (Paid) |

### Announcements (`/api/announcements`) — 3 endpoints

| Method | Route | Description | Access |
|---|---|---|---|
| `GET` | `/` | List announcements | Authenticated |
| `POST` | `/` | Create announcement (email if high priority) | Coordinator |
| `POST` | `/:id/read` | Mark announcement as read | Student |

### Notifications (`/api/notifications`) — 3 endpoints

| Method | Route | Description | Access |
|---|---|---|---|
| `GET` | `/` | Get notifications (limit 50) | Authenticated |
| `PUT` | `/:id/read` | Mark notification as read | Authenticated |
| `PUT` | `/read-all` | Mark all as read | Authenticated |

### Export (`/api/export`) — 3 endpoints

| Method | Route | Description | Access |
|---|---|---|---|
| `GET` | `/students` | Export student roster as CSV | Coordinator |
| `GET` | `/applications` | Export applications as CSV | Coordinator |
| `GET` | `/placement-report` | Export placement report as CSV | Coordinator |

---

## 6. Security Measures

| Layer | Implementation |
|---|---|
| **Authentication** | JWT (7-day expiry) with bcrypt password hashing |
| **Authorization** | Role-based middleware (`requireRole`) + tier checks (`requirePaid`) |
| **Rate Limiting** | 20 requests / 15 minutes on all auth endpoints |
| **Security Headers** | Helmet.js (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) |
| **CORS** | Restricted to `CLIENT_URL` origin with credentials |
| **File Upload** | Extension whitelist, Cloudinary cloud storage (no local traversal risk) |
| **Password Policy** | Forced change on first student login (`mustChangePassword` flag) |
| **Onboarding Gate** | Server-side middleware prevents incomplete profiles from accessing mutations |
| **Optimistic Concurrency** | Application stage updates check `expectedStage` to prevent race conditions |
| **Audit Trail** | All mutations logged with actor, action, target, details (90-day TTL) |
| **Secrets Management** | `.env` files excluded from Git, strong JWT secret guidance |

---

## 7. Background Jobs (Cron)

All cron jobs run in **production only** (`NODE_ENV === 'production'`).

| Job | Schedule | Purpose |
|---|---|---|
| `deadlineReminder` | Daily 8:00 AM | Email students about jobs closing within 48 hours (dedup: skips if reminder sent in last 24h) |
| `urgencyRefresh` | Daily | Recalculates urgency scores for all active jobs using `bulkWrite` |
| `autoClose` | Daily | Closes jobs past their deadline |
| `autoScrape` | Configurable | Scrapes tracked URLs for new jobs (with error alerting) |

---

## 8. Deployment

### Docker (Recommended)
```bash
docker-compose up --build
```
Starts 3 services:
- `mongodb` — MongoDB 6.0
- `server` — Node.js API (port 5001)
- `scraper` — Python FastAPI scraper service

### Manual
```bash
# Install dependencies
npm run install-all

# Seed database
npm run seed

# Run development
npm run dev
```

### Environment Variables
See `server/.env.example` for all required and optional configuration.

---

## 9. Testing

```bash
cd server
npm test
```

**Test suites:** 6 | **Tests:** 22 | **Framework:** Jest + Supertest + mongodb-memory-server

| Suite | Coverage |
|---|---|
| `auth.test.js` | Login, setup, password flows |
| `applications.test.js` | Apply, stage transitions, concurrency |
| `auth.middleware.test.js` | JWT verification, role guards |
| `storageService.test.js` | Cloudinary upload, file validation |
| `ats.test.js` | ATS scoring, synonym matching |
| `requireRole.test.js` | Role-based access control |
