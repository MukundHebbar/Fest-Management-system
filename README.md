# Fest Management System

MERN stack application for managing college fest events, registrations, and attendance.

## Tech Stack

### Backend

| Library | Why |
|---|---|
| Express | HTTP server and routing |
| Mongoose | MongoDB object modeling, schema validation |
| bcryptjs | Password hashing for user authentication |
| jsonwebtoken | JWT token generation and verification for auth |
| cookie-parser | Parse HTTP cookies (used for httpOnly JWT cookies) |
| cors | Handle cross-origin requests between frontend and backend |
| dotenv | Load environment variables from .env file |
| nodemailer | Send registration confirmation emails with ticket QR codes |
| qrcode | Generate QR code images from ticket IDs for emails |
| multer | Handle multipart file uploads in registration forms |
| mongodb | GridFS file storage for uploaded registration files |
| nodemon (dev) | Auto-restart server on file changes during development |

### Frontend

| Library | Why |
|---|---|
| React | UI framework |
| Vite | Fast dev server and build tool |
| React Router DOM | Client-side routing between pages |
| Axios | HTTP client for API requests with cookie support |
| React Hook Form | Form state management and validation |
| Shadcn/UI (Radix UI) | Pre-built accessible UI components (Card, Badge, Button, Table, etc.) |
| Tailwind CSS | Utility-first CSS for styling |
| class-variance-authority | Component variant styling (used internally by Shadcn) |
| clsx + tailwind-merge | Merge and deduplicate CSS class names |
| Lucide React | Icon library |
| qrcode.react | Render QR codes on the frontend for tickets |
| @yudiel/react-qr-scanner | Camera-based QR code scanning for attendance marking |
| Fuse.js | Fuzzy search for filtering events by name |

## Advanced Features

### Tier A

**1. Attendance with QR Scanning**
- On registration, each participant gets a unique ticket ID and a QR code (sent via email and shown on dashboard)
- Organizers can scan QR codes using the device camera to mark attendance
- Uses `@yudiel/react-qr-scanner` on frontend and a backend endpoint that looks up the ticket ID and toggles attendance
- Organizers can also manually toggle attendance from the registrations list

**2. Team-Based Events**
- Organizers can mark events as team-based and set team capacity (2-5 members)
- Team leader creates a team and gets a join code
- Other participants join using the code
- Registration is incomplete until the team reaches capacity (no ticket issued until full)
- Backend validates team capacity, prevents duplicate joins, and auto-generates ticket IDs when the team fills up

### Tier B

**1. Organizer Password Reset (Admin Workflow)**
- Organizers submit a password reset request with a reason
- Admin sees pending requests and can approve or reject
- On approval, password is reset to a random string and shown to the admin
- Organizers can view their request history and status
- Prevents duplicate pending requests

## Setup

```bash
# Backend
cd backend
npm install
npm start

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Requires a `.env` file in `backend/` with:
```
MONGO_URI=<mongodb connection string>
JWT_SECRET=<secret key>
GMAIL_USERNAME=<gmail address>
GMAIL_PASSWORD=<gmail app password>
```

## Production URL 
https://fest-management-system-ebon.vercel.app