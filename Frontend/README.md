<p align="center">
  <img src="https://img.shields.io/badge/LearnX-LMS-blueviolet?style=for-the-badge&logo=graduation-cap&logoColor=white" alt="LearnX Badge" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Framer_Motion-Animations-FF0055?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
</p>

<h1 align="center">🎓 LearnX — AI-Powered Learning Management System</h1>

<p align="center">
  <strong>A full-stack, production-ready LMS with role-based dashboards for Students, Teachers, and Admins.</strong><br/>
  Built with React, TypeScript, Supabase, and AI integration — designed for modern educational institutions.
</p>

<p align="center">
  <a href="https://learnflow-ai-49.lovable.app">🌐 Live Demo</a> •
  <a href="#-features">✨ Features</a> •
  <a href="#-tech-stack">🛠 Tech Stack</a> •
  <a href="#-architecture">🏗 Architecture</a>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
  - [🎒 Student Portal](#-student-portal)
  - [🧑‍🏫 Teacher Panel](#-teacher-panel)
  - [👑 Admin Dashboard](#-admin-dashboard)
  - [🤖 AI Features](#-ai-features)
  - [🔐 Authentication & Security](#-authentication--security)
- [Tech Stack](#-tech-stack)
- [Database Schema](#-database-schema)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)

---

## 🌟 Overview

**LearnX** is a comprehensive Learning Management System that digitizes the entire educational workflow — from attendance tracking and assignment management to AI-powered tutoring and salary management. It features **three distinct role-based dashboards** with real-time data synchronization, dark/light theme support, and a beautiful, responsive UI.

### 🎯 Key Highlights

| Feature | Description |
|---------|-------------|
| 🏫 **3 Role-Based Dashboards** | Separate interfaces for Students, Teachers, and Admins |
| 🤖 **AI Tutor (Gemini 3)** | Real-time AI chat for doubt solving with streaming responses |
| 📊 **Real-time Analytics** | Live attendance tracking, performance charts, and leaderboards |
| 📝 **Exam System** | MCQ-based exams with timer, auto-grading, and instant results |
| 💰 **Fee & Salary Management** | Complete financial tracking for students and teachers |
| 🌙 **Dark/Light Theme** | Beautiful themed UI with smooth transitions |
| 📱 **Fully Responsive** | Works perfectly on desktop, tablet, and mobile |
| 🔒 **Row-Level Security** | Enterprise-grade data protection with Supabase RLS |

---

## ✨ Features

### 🎒 Student Portal

<table>
<tr>
<td width="50%">

#### 📊 Dashboard
- **Personalized greeting** with student name
- **Stats cards** — Attendance %, Assignments, XP Points, Rank
- **Weekly progress chart** with area graph visualization
- **Upcoming classes** with real-time database integration
- **Sprint tasks** with completion tracking
- **Streak counter** for daily engagement

</td>
<td width="50%">

#### 📚 Lectures
- View all scheduled classes with subject, time, and location
- **Batch-wise filtering** for relevant classes
- Class status indicators (upcoming, completed, cancelled)
- Duration and teacher information display

</td>
</tr>
<tr>
<td>

#### 📝 Assignments
- View published assignments from teachers
- **Submit assignments** via link submission
- Track submission status (submitted, reviewed, graded)
- View grades and teacher feedback
- Due date tracking with overdue indicators

</td>
<td>

#### ✏️ Exams & Quizzes
- Attempt **MCQ-based exams** with live countdown timer
- **Auto-grading** — instant score calculation on submission
- View score breakdown with percentage
- Auto-submit when timer runs out
- Option selection with visual feedback (A, B, C, D)

</td>
</tr>
<tr>
<td>

#### ✅ Attendance
- **Self check-in** with GPS location verification
- **Selfie capture** for identity verification
- View attendance history with status (present/absent/late)
- Attendance percentage calculation
- Class-wise attendance records

</td>
<td>

#### 📅 Timetable
- **Weekly schedule view** with day-wise tabs (Mon–Sun)
- **Batch-wise filtering** for relevant classes
- Time slots with subject, teacher name, and room number
- Color-coded entries for visual clarity
- Responsive card layout

</td>
</tr>
<tr>
<td>

#### 🏖️ Leave Requests
- Submit **full-day or half-day** leave requests
- Provide reason for leave
- Track request status (pending/approved/rejected)
- View reviewer notes and decision history

</td>
<td>

#### 💰 Fee Management
- View **fee structure** for your batch (tuition, exam, library, etc.)
- **Payment progress bar** showing paid vs remaining
- Fee status indicators (paid ✅ / pending ⏳ / overdue 🔴)
- **Payment history** with receipt numbers and dates
- Due date reminders

</td>
</tr>
<tr>
<td>

#### 📈 Analytics
- Performance tracking with visual charts
- Subject-wise progress breakdown
- Attendance trends over time
- Assignment completion rates

</td>
<td>

#### 🏆 Leaderboard
- Student ranking based on XP points
- Competitive gamification element
- Batch-wise leaderboard filtering
- Streak and achievement tracking

</td>
</tr>
<tr>
<td>

#### 🤖 AI Tutor
- **Real-time AI chat** powered by Google Gemini 3
- Streaming responses for natural conversation feel
- Markdown-formatted answers with code blocks
- Doubt solving, concept explanation, study tips
- Chat history within session

</td>
<td>

#### 🔔 Notifications
- Real-time notifications from teachers/admin
- Mark as read functionality
- Priority-based notification types (info, warning, urgent)
- Unread count badge in navbar

</td>
</tr>
<tr>
<td colspan="2">

#### 👤 Profile
- View and edit personal information (name, bio, avatar)
- Avatar upload with cloud storage
- Batch and roll number display
- Account settings management

</td>
</tr>
</table>

---

### 🧑‍🏫 Teacher Panel

<table>
<tr>
<td width="50%">

#### 📅 Class Management
- **Create classes** with title, subject, batch, schedule, and location
- Set class duration and description
- **Manage class status** (scheduled, completed, cancelled)
- Date picker with calendar UI for scheduling
- Delete classes with confirmation

</td>
<td width="50%">

#### 📝 Assignment Management
- **Create assignments** with title, description, due date
- Set max score and batch targeting
- **Publish/draft** workflow for assignments
- **Review submissions** — view student submissions
- **Grade assignments** with feedback and score

</td>
</tr>
<tr>
<td>

#### ✅ Student Attendance
- **Mark attendance** for students in a class
- Bulk attendance marking (present/absent/late)
- View attendance records per class
- Attendance history with filters

</td>
<td>

#### ✏️ Exam Creation
- **Create exams/quizzes** with type (Quiz, Mid-term, Final, Practice)
- Set duration, total marks, batch, and schedule
- **Add MCQ questions** with 4 options and correct answer
- Set marks per question
- **Publish exams** to make them available to students
- View student submissions and scores

</td>
</tr>
<tr>
<td>

#### 📢 Announcements
- **Post announcements** to all students or specific batches
- Set priority level (normal, important, urgent)
- Rich text content support
- Batch-targeted announcements

</td>
<td>

#### 📅 Timetable Management
- **Add class slots** to the weekly timetable
- Set day, time, subject, and room
- Manage own timetable entries
- Delete outdated slots

</td>
</tr>
<tr>
<td>

#### 🏖️ Leave Management
- **Request leaves** (full-day or half-day)
- Provide leave reason
- Track approval status from admin
- View leave history

</td>
<td>

#### ✅ My Attendance
- **Mark daily attendance** with one click
- Prevents duplicate marking (once per day)
- View personal attendance history
- Check-in time recording

</td>
</tr>
</table>

---

### 👑 Admin Dashboard

<table>
<tr>
<td width="50%">

#### 👥 User Management
- **View all users** with roles, status, and batch
- **Search users** by name
- **Change user roles** (Student ↔ Teacher ↔ Admin)
- **Approve/reject** new user registrations
- **Remove users** from the system
- User count statistics with role breakdown
- Visual role badges (Student 🎓, Teacher 🧑‍🏫, Admin 👑)

</td>
<td width="50%">

#### 📊 Overview Statistics
- Total users count with breakdown
- Pending approvals counter
- Active classes and assignments count
- Quick action cards with trend indicators

</td>
</tr>
<tr>
<td>

#### ✅ Teacher Attendance Monitoring
- **View all teacher attendance records** with date and time
- Real-time attendance tracking
- Filter by date and teacher
- Attendance status overview

</td>
<td>

#### 🏖️ Teacher Leave Approval
- **View all pending leave requests** from teachers
- **Approve or Reject** leave requests
- Add reviewer notes with decisions
- Leave type display (full-day/half-day)
- Leave history with status tracking

</td>
</tr>
<tr>
<td>

#### 💰 Salary Management
- **Configure salary** for each teacher individually
- Choose between **Per Day** or **Fixed Monthly** salary type
- Set daily rate or monthly salary amount
- **Auto-calculate monthly payroll** based on:
  - Days present in current month
  - Full-day leaves (100% deduction)
  - Half-day leaves (50% deduction)
- Real-time salary preview with breakdown

</td>
<td>

#### 💳 Fee Management
- **Create fee structures** (Tuition, Exam, Library, Sports, Transport)
- Set batch-wise fees with due dates
- **Record student payments** (Cash, UPI, Bank Transfer, Cheque)
- Generate receipt numbers
- Track payment history across all students
- Payment method tracking

</td>
</tr>
<tr>
<td colspan="2">

#### 🔧 Additional Admin Powers
- Access to **all teacher features** (classes, assignments, attendance)
- **System-wide notifications** management
- Full timetable management for all batches
- Complete exam oversight and management

</td>
</tr>
</table>

---

### 🤖 AI Features

| Feature | Technology | Description |
|---------|------------|-------------|
| **AI Tutor Chat** | Google Gemini 3 Flash | Real-time streaming AI chat for student doubt solving |
| **Smart Responses** | Markdown Rendering | Formatted responses with headings, code blocks, lists |
| **Context-Aware** | System Prompt | Tutor understands LMS context, provides educational guidance |
| **Rate Limiting** | Edge Functions | Handles API limits gracefully with user-friendly messages |

---

### 🔐 Authentication & Security

| Feature | Implementation |
|---------|---------------|
| **Role-Based Access** | `app_role` enum (admin, teacher, student) with `user_roles` table |
| **Row-Level Security** | Every table has RLS policies — users can only access their own data |
| **Security Definer Functions** | `has_role()` function prevents recursive RLS checks |
| **Email Verification** | Users must verify email before accessing the platform |
| **Auto Profile Creation** | Database trigger creates profile + default role on signup |
| **Protected Routes** | React router guards prevent unauthorized page access |
| **Session Management** | Supabase Auth with automatic token refresh |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI library with hooks and functional components |
| **TypeScript** | Type-safe development |
| **Vite** | Lightning-fast build tool and dev server |
| **Tailwind CSS** | Utility-first CSS framework |
| **Framer Motion** | Smooth animations and transitions |
| **Recharts** | Data visualization (charts and graphs) |
| **React Router v6** | Client-side routing with protected routes |
| **React Query** | Server state management and caching |
| **Lucide Icons** | Beautiful, consistent icon library |
| **Sonner** | Toast notifications |
| **shadcn/ui** | Radix-based accessible UI components |
| **react-markdown** | Markdown rendering for AI responses |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Supabase** | Backend-as-a-Service (BaaS) |
| **PostgreSQL** | Relational database with RLS |
| **Supabase Auth** | Authentication with email/password |
| **Edge Functions (Deno)** | Serverless functions for AI integration |
| **Supabase Realtime** | Live data subscriptions |
| **Supabase Storage** | File storage for avatars and selfies |

### AI Integration
| Technology | Purpose |
|-----------|---------|
| **Google Gemini 3 Flash** | AI model for tutor chat |
| **Lovable AI Gateway** | Managed AI API proxy |
| **Server-Sent Events (SSE)** | Streaming AI responses |

---

## 🗄️ Database Schema

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│     profiles         │     │     user_roles        │     │     classes          │
├─────────────────────┤     ├──────────────────────┤     ├─────────────────────┤
│ id (PK)             │     │ id (PK)              │     │ id (PK)             │
│ user_id (FK→auth)   │     │ user_id (FK→auth)    │     │ teacher_id          │
│ full_name           │     │ role (enum)           │     │ title, subject      │
│ avatar_url          │     └──────────────────────┘     │ batch, schedule     │
│ batch, roll_no      │                                   │ duration, location  │
│ bio, is_approved    │                                   │ status              │
└─────────────────────┘                                   └─────────────────────┘

┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   attendance         │     │  teacher_attendance   │     │   timetable         │
├─────────────────────┤     ├──────────────────────┤     ├─────────────────────┤
│ student_id, class_id│     │ teacher_id, date      │     │ batch, day_of_week  │
│ status, selfie_url  │     │ status, check_in_time │     │ start_time, end_time│
│ GPS (lat/long)      │     │ check_out_time        │     │ subject, teacher_id │
│ location_verified   │     │ notes                 │     │ room                │
└─────────────────────┘     └──────────────────────┘     └─────────────────────┘

┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  teacher_assignments │     │assignment_submissions │     │   exams             │
├─────────────────────┤     ├──────────────────────┤     ├─────────────────────┤
│ teacher_id, title   │     │ assignment_id         │     │ title, exam_type    │
│ description, batch  │     │ student_id            │     │ duration_minutes    │
│ due_date, max_score │     │ submission_link       │     │ total_marks, batch  │
│ status (draft/pub)  │     │ grade, feedback       │     │ status, teacher_id  │
└─────────────────────┘     └──────────────────────┘     └─────────────────────┘

┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   exam_questions     │     │  exam_submissions     │     │   fee_structure     │
├─────────────────────┤     ├──────────────────────┤     ├─────────────────────┤
│ exam_id, question   │     │ exam_id, student_id   │     │ batch, fee_type     │
│ options (JSONB)     │     │ answers (JSONB)        │     │ amount, due_date    │
│ correct_answer      │     │ score, percentage     │     │ description         │
│ marks, sort_order   │     │ status                │     │                     │
└─────────────────────┘     └──────────────────────┘     └─────────────────────┘

┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   fee_payments       │     │  leave_requests       │     │teacher_leave_requests│
├─────────────────────┤     ├──────────────────────┤     ├─────────────────────┤
│ student_id          │     │ student_id            │     │ teacher_id          │
│ fee_structure_id    │     │ leave_date, type      │     │ leave_date, type    │
│ amount_paid         │     │ reason, status        │     │ reason, status      │
│ payment_method      │     │ reviewed_by           │     │ reviewed_by         │
│ receipt_no          │     │ reviewer_note         │     │ reviewer_note       │
└─────────────────────┘     └──────────────────────┘     └─────────────────────┘

┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  announcements       │     │  notifications        │     │teacher_salary_config│
├─────────────────────┤     ├──────────────────────┤     ├─────────────────────┤
│ teacher_id, title   │     │ user_id, title        │     │ teacher_id          │
│ content, priority   │     │ message, type         │     │ salary_type         │
│ batch               │     │ is_read               │     │ monthly_salary      │
└─────────────────────┘     └──────────────────────┘     │ daily_rate          │
                                                          └─────────────────────┘
```

**Total Tables: 16** | **All with Row-Level Security** | **Realtime enabled on key tables**

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌───────────┐ │
│  │ Student  │  │ Teacher  │  │  Admin  │  │  Auth     │ │
│  │Dashboard │  │  Panel   │  │Dashboard│  │  Pages    │ │
│  └────┬─────┘  └────┬─────┘  └────┬────┘  └─────┬────┘ │
│       │              │             │              │      │
│  ┌────▼──────────────▼─────────────▼──────────────▼────┐ │
│  │           AuthContext (Role-Based Routing)          │ │
│  └────────────────────────┬────────────────────────────┘ │
└───────────────────────────┼──────────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │  Supabase SDK │
                    └───────┬───────┘
                            │
┌───────────────────────────▼──────────────────────────────┐
│                   SUPABASE BACKEND                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │PostgreSQL│  │   Auth   │  │ Realtime │  │ Storage │ │
│  │  + RLS   │  │(Email/PW)│  │  (Live)  │  │(Files)  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│  ┌──────────────────────────────────────────────────────┐ │
│  │            Edge Functions (Deno Runtime)              │ │
│  │  ┌──────────┐  ┌─────────────┐  ┌────────────────┐  │ │
│  │  │ AI Tutor │  │ Add Student │  │  Add Teacher   │  │ │
│  │  │(Gemini 3)│  │  (Signup)   │  │   (Signup)     │  │ │
│  │  └──────────┘  └─────────────┘  └────────────────┘  │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or bun
- Supabase account (or use Lovable Cloud)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd learnx-lms

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

---

## 📸 Screenshots

| Student Dashboard | Teacher Panel | Admin Dashboard |
|:-:|:-:|:-:|
| Stats, charts, upcoming classes | Class & assignment management | User management, salary config |

| AI Tutor | Exam System | Fee Management |
|:-:|:-:|:-:|
| Real-time AI chat | MCQ with timer | Payment tracking |

---

## 👨‍💻 Developer

Built with ❤️ using **Lovable** — the AI-powered full-stack development platform.

### 📊 Project Stats

| Metric | Value |
|--------|-------|
| **Total Pages** | 18+ |
| **Database Tables** | 16 |
| **Edge Functions** | 4 |
| **UI Components** | 60+ (shadcn/ui) |
| **RLS Policies** | 35+ |
| **Lines of Code** | 10,000+ |

---

<p align="center">
  <strong>⭐ Star this repo if you found it helpful!</strong><br/>
  <em>LearnX — Transforming Education with Technology 🚀</em>
</p>
