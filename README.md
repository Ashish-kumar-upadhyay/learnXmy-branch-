<div align="center">

# 🎓 LearnX — Smart Learning Management System

### One platform. Three roles. A smarter way to learn, teach, and manage.

**An AI-powered Learning Management System built to bring academic operations, student engagement, assessments, and administration into one connected platform.**

[![Live Website](https://img.shields.io/badge/🌐_Live_Website-learnxplatform.qzz.io-2563EB?style=for-the-badge)](https://learnxplatform.qzz.io)
[![Frontend](https://img.shields.io/badge/Frontend-React_%2B_TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node.js_%2B_Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

</div>

---

## ✨ About LearnX

**LearnX** is a centralized, AI-powered LMS designed for educational institutions. It connects administrators, teachers, and students through dedicated role-based dashboards and tools.

Instead of managing attendance, lectures, assignments, exams, fees, communication, and student support across separate systems, LearnX brings these academic workflows together in one platform.

The system follows a structured onboarding process: administrators create teacher accounts with unique teacher codes; teachers and administrators can add students; and newly created students receive their login credentials through email.

🔗 **Live platform:** [https://learnxplatform.qzz.io](https://learnxplatform.qzz.io)

---

## 👥 Three Role-Based Portals

<table>
<tr>
<td width="33%" valign="top">

### 🛡️ Admin Portal

- Create and manage teacher accounts
- Create and manage student accounts
- Generate unique teacher codes
- Update user names and email details
- Remove and manage users
- Monitor total students and teachers
- Oversee classes and assignments
- Manage fee structures and payments
- Review and escalate support tickets
- Monitor daily attendance
- View institution-wide analytics

</td>
<td width="33%" valign="top">

### 👨‍🏫 Teacher Portal

- Manage classes and students
- Create assignments and quizzes
- Create exams and announcements
- Generate learning content with AI
- Mark daily attendance with location
- Review student submissions
- Track student performance
- Identify students who need support
- View academic analytics
- Manage leave requests
- Respond to support tickets
- Use AI assistance for teaching topics

</td>
<td width="33%" valign="top">

### 🎓 Student Portal

- Personalized academic dashboard
- Watch lecture videos
- Submit assignments before deadlines
- Attend online exams and quizzes
- View attendance and performance reports
- Check timetable and announcements
- Track fees and make payments
- Apply for leave
- View leaderboard rankings
- Raise support tickets
- Use the AI Tutor
- Manage profile and preferences

</td>
</tr>
</table>

---

## 🚀 Feature Highlights

### 📊 1. Personalized Student Dashboard
Students get a consolidated view of their academic activity, including attendance, assignments, exam performance, timetable, fee status, and progress reports.

### 🎥 2. Lecture Management
Teachers can organize learning content, while students can access lecture videos from their portal.

### 📝 3. Assignment Management
- Teachers create and publish assignments with deadlines.
- Students submit their work through the platform.
- Late submissions are marked as overdue according to the assignment deadline rules.
- Teachers can review submissions and award marks.

### 🧠 4. Online Exams & Anti-Cheating Measures
- Students can attempt scheduled exams and quizzes.
- Tab-switch activity is monitored during an exam.
- A warning is displayed after a detected tab switch.
- Repeated violations can trigger automatic submission.
- AI-assisted screen monitoring is included as an additional measure to help identify suspicious activity.

> Monitoring signals are intended to support exam integrity; they should not be treated as infallible proof of misconduct.

### 📍 5. Location & Selfie-Based Attendance
- Attendance workflows support location capture and selfie/photo verification.
- Student attendance can distinguish full-day, half-day, and lecture-level attendance.
- Teachers also have a location-based daily attendance workflow.
- Attendance records feed into dashboards and reports.

### 🤖 6. AI Tutor & Teacher AI Assistant
- Students can ask academic questions and receive AI-generated explanations.
- Students can attach an image when describing a doubt or problem.
- Teachers can use AI assistance for topic-related questions.
- Teachers can generate draft quizzes, exams, and assignments by entering a topic.
- AI-generated content can be reviewed before it is used.

### 🎫 7. Support Ticket & Escalation System
- Students can raise tickets when they face an issue.
- Teachers can review and resolve student tickets.
- If a ticket remains unresolved for 24 hours, it is escalated to the Admin for visibility and follow-up.

### 🔔 8. Notifications & Announcements
- Notifications keep users informed about new academic activities and updates.
- Sound alerts help draw attention to new notifications.
- Teachers can publish announcements for students.

### 📅 9. Timetable, Leave & Sprint Plans
- Students can view their timetable.
- Students and teachers can submit leave requests.
- Sprint plans help organize learning or work into focused seven-day plans.

### 🏆 10. Leaderboard & Academic Analytics
- Students can view leaderboard rankings.
- Teachers can review student and subject-level performance.
- Analytics help identify students who may be struggling in a subject.
- Admins can monitor institution-wide activity and attendance trends.

### 💳 11. Fee Management
- Students can view their fee details and payment status.
- Students can make payments through the available payment workflow.
- Admins can manage fee information and monitor payments.

### 🔎 12. Search, Profiles & Themes
- Search functionality helps users find relevant platform information.
- Users can update permitted profile details.
- Light and dark themes provide a more comfortable interface.

---

## 🧰 Technology Stack

> **Repository implementation note:** The supplied project archive contains a React + Vite frontend and a separate Express + TypeScript backend. The backend uses MongoDB through Mongoose. This README reflects the code structure in that archive.

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling & UI | Tailwind CSS, shadcn/ui, Radix UI |
| Animations | Framer Motion |
| Routing | React Router |
| Data & UI state | TanStack React Query |
| Forms & validation | React Hook Form, Zod |
| Charts | Recharts |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| Real-time communication | Socket.IO |
| Email | Nodemailer |
| File uploads | Multer |
| AI integration | Google Generative AI SDK |
| Deployment & domain | Vercel, Cloudflare |

---

## 🏗️ High-Level Architecture

```text
                    ┌─────────────────────────┐
                    │       End User          │
                    │ Admin / Teacher / Student│
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     Cloudflare DNS      │
                    │   Domain / Edge Layer   │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    Vercel Deployment    │
                    │   Frontend Application  │
                    └────────────┬────────────┘
                                 │ HTTPS API
                                 ▼
                    ┌─────────────────────────┐
                    │   Express API Server    │
                    │ Controllers / Routes    │
                    │ Middleware / Validation│
                    └────────────┬────────────┘
                                 │
                  ┌──────────────┼──────────────┐
                  ▼              ▼              ▼
           ┌────────────┐ ┌────────────┐ ┌────────────┐
           │  MongoDB   │ │ AI Service │ │ Email /    │
           │ + Mongoose │ │ Integration│ │ Socket.IO  │
           └────────────┘ └────────────┘ └────────────┘
```

*Deployment note: Cloudflare manages the domain/DNS layer and Vercel serves the deployed frontend. The API server and database must be deployed/configured separately according to the production environment.*

---

## 🔐 Authentication & Access Control

LearnX uses role-based access so users can access only the features permitted for their role.

1. An administrator creates a teacher account and assigns a unique teacher code.
2. The teacher signs in using the assigned credentials.
3. An administrator or teacher creates a student account.
4. The student receives login details through the configured email service.
5. Authenticated requests are verified by backend middleware.
6. Role-based middleware checks whether the user is allowed to access a protected resource.

The backend includes JWT utilities, password hashing, authentication middleware, role middleware, and request validation.

---

## 🗂️ Project Structure

```text
LearnX/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── integrations/
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
│
├── learnx-backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── uploads/
│   └── package.json
│
└── README.md
```

---

## 🧩 Backend Modules

The backend is organized into separate models, controllers, and routes to keep responsibilities modular.

| Module | Responsibility |
|---|---|
| Authentication & Users | Login, user creation, profiles, roles |
| Classes & Timetable | Class organization and schedules |
| Lectures | Lecture content management |
| Assignments | Assignment creation and submissions |
| Exams | Exam creation, questions, attempts, results |
| Attendance | Student and teacher attendance |
| Analytics | Academic and attendance reporting |
| AI | AI Tutor and AI-assisted learning workflows |
| Notifications | User notifications and updates |
| Support Tickets | Issue tracking and escalation |
| Fees & Payments | Fee records and payment tracking |
| Sprint Plans | Seven-day plans and tasks |
| Announcements | Teacher-to-student communication |
| Files | Upload and file metadata handling |

---

## ⚙️ Run Locally

### Prerequisites

- Node.js 18+
- npm
- MongoDB instance (local or MongoDB Atlas)
- Git

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd LearnX
```

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Vite will display the local development URL in the terminal (commonly `http://localhost:5173`).

### 3. Configure and start the backend

Open a second terminal:

```bash
cd learnx-backend
npm install
```

Create a `.env` file in `learnx-backend/` and add the environment variables required by your backend configuration.

Example configuration (use the exact variable names expected by `src/config/environment.ts`):

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
```

Add any additional credentials required by the enabled integrations, such as email, AI, OAuth, or file-storage services. Do not commit real secrets.

Start the backend:

```bash
npm run dev
```

### 4. Production build

Frontend:

```bash
cd frontend
npm run build
```

Backend:

```bash
cd learnx-backend
npm run build
npm start
```

---

## 🌍 Deployment

The live platform is available at:

**[learnxplatform.qzz.io](https://learnxplatform.qzz.io)**

The deployment setup described for LearnX:

- **Vercel:** frontend hosting and deployment workflow.
- **Cloudflare:** domain DNS management and available edge/security services.
- **MongoDB:** application data storage through the backend.
- **Environment variables:** production secrets and service credentials are configured outside source code.

---

## 🔍 SEO & Discoverability

LearnX has been made publicly accessible and its pages/domain have been submitted for search-engine discovery.

SEO-related work includes:

- Page titles and meta descriptions
- Search-engine-friendly page content
- Sitemap and robots configuration
- Semantic HTML and heading structure
- Google Search Console monitoring
- Indexing and search visibility checks

> Search indexing and ranking are controlled by search engines and can change over time.

---

## 🔒 Security Practices

The backend includes or is structured to support:

- JWT-based authentication
- Password hashing with bcryptjs
- Role-based route protection
- Request validation
- Centralized error handling
- Security headers through Helmet
- Rate limiting
- Environment-based secret management
- Controlled file upload handling

Always use HTTPS in production, keep dependencies updated, validate uploaded files, and avoid exposing private credentials in frontend code or Git history.

---

## 🛣️ Potential Future Improvements

- More granular permission management
- Expanded automated test coverage
- Advanced audit logs for administrative actions
- Deeper learning recommendations based on student progress
- More detailed accessibility improvements
- Additional reporting and export options
- Performance monitoring and load testing

---

## 👨‍💻 Project

**LearnX — AI-Powered Learning Management System**

🌐 Live: [learnxplatform.qzz.io](https://learnxplatform.qzz.io)

Built to simplify academic management and create a more connected learning experience for administrators, teachers, and students.

---

<div align="center">

### ⭐ If you find this project interesting, consider giving the repository a star!

**LearnX — Learn smarter. Teach better. Manage everything in one place.**

</div>
