# 🎬 LearnX — AI Video Script Prompt

> **Use this prompt with any AI video generator (Synthesia, HeyGen, Pictory, InVideo AI, etc.) to create a professional walkthrough video of the LearnX platform.**

---

## 📋 VIDEO PROMPT

```
Create a professional, cinematic product walkthrough video for "LearnX" — a modern, AI-powered Learning Management System (LMS) built for educational institutes. The video should feel like a premium SaaS product demo with smooth transitions, clean text overlays, and an energetic yet professional tone. Duration: 4-6 minutes.

---

🎬 SCENE 1: INTRO (15 seconds)
---
Open with a bold title card animation:

"LearnX — The Future of Classroom Management"
"One Platform. Three Powerful Roles. Unlimited Possibilities."

Tagline: "Built with React, TypeScript, Tailwind CSS & Supabase — a full-stack production-grade LMS."

---

🎬 SCENE 2: ROLE SELECTION & AUTHENTICATION (20 seconds)
---
Show the beautiful role selection screen where users choose their identity:

• Three role cards appear with smooth animations — Student, Teacher, and Admin
• Each card has a unique icon, gradient accent, and hover effect
• Clicking a role opens a sleek login/signup form with email and password
• Email verification is required before first login — ensuring security from day one
• "Forgot Password" flow sends a secure reset link to the user's email
• After login, the system detects your role and redirects to the correct dashboard automatically
• The entire auth system uses Row-Level Security — every user only sees their own data

---

🎬 SCENE 3: STUDENT DASHBOARD (60 seconds)
---
Title overlay: "👨‍🎓 Student Panel — Everything a Learner Needs"

The student logs in and lands on a stunning dashboard with glassmorphism cards and real-time stats:

📊 DASHBOARD HOME:
• Four stat cards show: Attendance Percentage, Assignments Completed, Learning Streak (consecutive days), and Current Rank
• A weekly progress chart visualizes study hours and tasks completed per day using interactive bar charts
• Upcoming deadlines section shows the next 3 assignments and exams with countdown timers
• A motivational walking character animation appears at the bottom, gamifying the experience

📚 LECTURES PAGE:
• Students see all recorded and live lectures in a beautiful card grid
• Each lecture card shows: Subject name, Instructor name, Duration, Date, and a progress bar
• Live lectures have a pulsing red "LIVE" badge with animation
• Recorded lectures show completion percentage with smooth animated progress bars
• Filter buttons let students quickly switch between All, In Progress, Completed, and Live lectures
• A download button appears on hover for offline access

📝 ASSIGNMENTS PAGE:
• All published assignments appear in a clean list with status badges — Pending (yellow), Submitted (green), Reviewed (blue), Late (red)
• Each assignment shows: Title, Batch, Due Date, Duration to complete, and Maximum Score
• A real-time countdown timer shows exactly how many days and hours remain before the deadline
• If the deadline has passed, it shows "Overdue" in red with a warning icon
• Students click "Submit" to open a modal dialog where they paste their GitHub, Google Drive, or any submission link
• URL validation ensures only valid links are accepted
• After submission, the card updates instantly to show "Submitted" status with a green checkmark
• Once a teacher reviews it, the Grade and Feedback appear directly on the card
• The submitted link is clickable and opens in a new tab

📊 ANALYTICS PAGE:
• Visual charts and graphs show the student's performance trends over time
• Attendance trends, assignment completion rates, and exam scores are displayed in beautiful recharts visualizations
• Students can track their improvement week over week

🏆 LEADERBOARD PAGE:
• A competitive leaderboard ranks all students by XP (experience points)
• Top 3 students get gold, silver, and bronze badges with trophy emojis
• Each entry shows: Rank, Name, XP points, Learning Streak, and Avatar
• The current student's row is highlighted so they can instantly spot their position
• This gamification element motivates students to stay consistent

🤖 AI TUTOR PAGE:
• Students can chat with an AI tutor powered by Google Gemini AI
• They type any academic question and receive detailed, formatted responses with markdown support
• The AI maintains conversation history within the session
• Code blocks, bullet points, and formatted text make complex answers easy to understand
• This feature works without any API key — it's built into the platform seamlessly

📅 TIMETABLE PAGE:
• A beautiful weekly timetable grid shows all classes organized by day and time
• Each slot shows: Subject, Time, Room number, and Teacher name
• The current day is highlighted automatically
• Students can see their entire week's schedule at a glance

✅ ATTENDANCE PAGE:
• Students see their attendance records with date, class, subject, and status (Present/Absent/Late)
• GPS location verification ensures students are physically present in the classroom
• Selfie-based check-in adds an extra layer of attendance verification
• Attendance percentage is calculated and displayed prominently
• Color-coded status badges make it easy to scan attendance history

📋 LEAVE REQUESTS:
• Students can apply for leave by selecting a date, leave type (Sick/Personal/Family Emergency/Other), and writing a reason
• Submitted requests show status: Pending (yellow), Approved (green), or Rejected (red)
• If a teacher reviews it, the reviewer's note is displayed
• Students can track all their leave history in one place

🧾 FEE MANAGEMENT:
• Students see their fee structure with amount, due date, and fee type (Tuition/Lab/Library/Exam)
• Payment history shows all transactions with receipt numbers, payment method, and status
• A clear summary shows total fees, amount paid, and outstanding balance
• Overdue fees are highlighted in red as warnings

🔔 NOTIFICATIONS:
• Real-time notification bell in the header shows unread count with a red badge
• Clicking opens the notifications page with all alerts sorted by time
• Each notification has an icon matching its type — Assignment, Exam, Attendance, Fee, Leave, Announcement
• Unread notifications have a blue left border and bold text
• Clicking a notification marks it as read AND navigates to the relevant page automatically
• Time stamps show "5m ago", "2h ago", "3d ago" for easy scanning
• "Mark all as read" button clears all unread notifications at once

👤 PROFILE PAGE:
• Students can view and edit their profile information
• Avatar, Full Name, Bio, Batch, Roll Number, and Class are all editable
• Profile updates are saved to the database instantly

📋 EXAM SYSTEM:
• Students see all published exams with title, type (Quiz/Mid-term/Final), duration, total marks, and scheduled date
• Clicking "Attempt Exam" starts a timed exam with MCQ questions
• Each question shows options as clickable cards with smooth selection animations
• A timer counts down in real-time — when time expires, the exam auto-submits
• Navigation buttons let students move between questions freely
• After submission, the system auto-grades the exam instantly
• Results show: Score, Percentage, Total Marks, and individual question results
• Students can review which answers were correct and which were wrong

---

🎬 SCENE 4: TEACHER DASHBOARD (60 seconds)
---
Title overlay: "👩‍🏫 Teacher Panel — Complete Classroom Control"

The teacher logs in and sees a powerful management dashboard:

📊 TEACHER DASHBOARD HOME:
• Overview cards show: Total Classes, Total Students, Pending Assignments to Review, and Today's Schedule
• Quick action buttons for creating classes, assignments, and exams
• Recent activity feed shows latest submissions and attendance records

📅 CLASS MANAGEMENT:
• Teachers create classes with: Title, Subject, Batch, Scheduled Date/Time, Duration, Location, and Description
• Classes appear in a organized list with status badges (Scheduled/Completed/Cancelled)
• Each class card shows all details at a glance with edit capabilities

📝 ASSIGNMENT MANAGEMENT:
• Teachers create assignments with: Title, Description, Batch, Due Date, Duration (hours), and Maximum Score
• Assignments start as "Draft" and can be "Published" when ready — students only see published assignments
• A submissions panel shows all student submissions for each assignment
• Teachers can click any submission link to review the student's work
• Grade and Feedback fields let teachers evaluate each submission individually
• After review, the student instantly sees their grade and feedback on their assignments page

📋 EXAM & QUIZ CREATION:
• Teachers create exams with: Title, Description, Type (Quiz/Mid-term/Final/Assignment), Batch, Duration, Total Marks, and Scheduled Date
• After creating an exam, teachers add MCQ questions one by one
• Each question has: Question Text, 4 Options (A/B/C/D), Correct Answer, and Marks
• Questions can be reordered and edited after creation
• Exams start as "Draft" — teachers click "Publish" to make them visible to students
• The system auto-grades all student submissions and teachers can view results and statistics

✅ STUDENT ATTENDANCE MARKING:
• Teachers open a class and see the full student roster for that batch
• One-tap attendance marking: Present, Absent, or Late for each student
• Bulk actions allow marking all students present at once
• Attendance records are saved with timestamp and teacher ID
• GPS and selfie verification data is captured when students self-check-in

📋 TEACHER'S OWN ATTENDANCE:
• Teachers have their own attendance tracking separate from student attendance
• Check-in and Check-out times are recorded daily
• Status tracking: Present, Absent, Late, or Half-Day
• Monthly attendance history with notes

📅 TEACHER LEAVE REQUESTS:
• Teachers can apply for their own leave — same workflow as students
• Leave types: Sick Leave, Personal Leave, Family Emergency, Other
• Admin reviews and approves/rejects teacher leave requests
• Leave history is maintained with reviewer notes

📢 ANNOUNCEMENTS:
• Teachers create announcements with: Title, Content, Priority (Normal/Important/Urgent), and Target Batch
• Announcements are sent as notifications to all students in the selected batch
• Priority levels have different visual indicators — Urgent announcements stand out with red styling

📊 TIMETABLE MANAGEMENT:
• Teachers can view the timetable showing their assigned classes
• Schedule overview helps teachers plan their week

💰 SALARY INFORMATION:
• Teachers can view their salary configuration
• Two salary types supported: Fixed Monthly and Per-Day basis
• Monthly salary or daily rate is displayed clearly

---

🎬 SCENE 5: ADMIN DASHBOARD (50 seconds)
---
Title overlay: "🛡️ Admin Panel — Total Institute Control"

The admin logs in and gets the ultimate control center:

📊 ADMIN DASHBOARD HOME:
• High-level statistics: Total Students, Total Teachers, Pending Approvals, and Revenue Overview
• Quick action cards for common administrative tasks

👥 USER MANAGEMENT — STUDENT APPROVAL:
• When new students register, they appear in a "Pending Approval" queue
• Admin sees each student's: Name, Email, Batch, Roll Number, and Registration Date
• Two action buttons: Approve (green checkmark) or Reject (red X)
• Approved students can immediately access their dashboard
• Rejected students are removed from the system
• This ensures only legitimate students access the platform

👥 USER MANAGEMENT — TEACHER MANAGEMENT:
• Admin can add new teachers by entering: Name, Email, and Password
• The system creates the teacher account and assigns the "teacher" role automatically
• A list shows all registered teachers with their details
• Admin can manage teacher accounts and permissions

💰 FEE STRUCTURE MANAGEMENT:
• Admin creates fee structures with: Fee Type (Tuition/Lab/Library/Exam), Batch, Amount, Due Date, and Description
• Fee structures are assigned to specific batches
• Admin can view all fee structures in a organized table
• This defines what students see in their fee management page

💵 TEACHER SALARY CONFIGURATION:
• Admin sets salary for each teacher individually
• Two modes: Fixed Monthly Salary or Per-Day Rate
• Changes are saved instantly and reflected in the teacher's profile

📋 FEE PAYMENT RECORDING:
• Admin records student fee payments with: Student, Fee Structure, Amount Paid, Payment Method, and Receipt Number
• Payment methods supported: Cash, UPI, Bank Transfer, Cheque, Online
• Payment status tracking: Paid, Partial, or Pending
• Complete payment history with audit trail

📅 TIMETABLE CREATION:
• Admin creates the master timetable for all batches
• Each entry includes: Day of Week, Start Time, End Time, Subject, Teacher, Batch, and Room
• The timetable is immediately visible to both students and teachers of that batch

📢 INSTITUTE-WIDE ANNOUNCEMENTS:
• Admin can create announcements visible to all users across the institute
• Priority-based announcement system for important notices

---

🎬 SCENE 6: CROSS-CUTTING FEATURES (30 seconds)
---
Title overlay: "✨ Platform-Wide Features"

🌓 DARK MODE & LIGHT MODE:
• A beautiful theme toggle in the header switches between dark and light themes instantly
• Every single component, card, chart, and text adapts perfectly to both themes
• The dark mode uses deep navy and slate tones with glowing accent colors
• The light mode is clean and crisp with subtle shadows and borders

📱 FULLY RESPONSIVE DESIGN:
• The entire platform works flawlessly on desktop, tablet, and mobile devices
• On mobile, the sidebar collapses into a hamburger menu with smooth slide-in animation
• All cards, tables, and forms stack beautifully on smaller screens
• Touch-friendly buttons and inputs for mobile users

🔐 ROLE-BASED ACCESS CONTROL:
• The sidebar navigation dynamically changes based on the logged-in user's role
• Students see: Dashboard, Lectures, Assignments, Exams, Attendance, Leave, Fees, AI Tutor, Leaderboard, Analytics, Timetable, Notifications, Profile
• Teachers see: Dashboard, Classes, Assignments, Exams, Attendance, Leave, Timetable, Announcements, Notifications, Profile
• Admins see: Dashboard, User Management, Fee Management, Timetable, Salary Config, Notifications, Profile
• Row-Level Security ensures users can NEVER access data that doesn't belong to them — even if they try to manipulate the URL

🔔 REAL-TIME NOTIFICATIONS:
• The notification system works across all three roles
• Unread count badge updates every 30 seconds automatically
• Notifications are generated for: New assignments, Exam publications, Attendance reminders, Fee due dates, Leave request updates, and Announcements

🎨 GLASSMORPHISM UI DESIGN:
• The entire UI uses a modern glassmorphism design language with frosted glass cards
• Smooth Framer Motion animations on every page load with staggered card reveals
• Gradient accents, subtle borders, and depth-creating shadows
• Professional color palette with semantic tokens for consistent theming

---

🎬 SCENE 7: TECH STACK SHOWCASE (20 seconds)
---
Title overlay: "🛠️ Built With Modern Technology"

Show tech stack logos with brief descriptions:
• React 18 + TypeScript — Type-safe, component-based frontend
• Tailwind CSS 4 — Utility-first styling with custom design system
• Supabase — PostgreSQL database, Authentication, Edge Functions, Row-Level Security
• Framer Motion — Smooth, physics-based animations
• Recharts — Beautiful data visualizations
• Google Gemini AI — Intelligent AI tutoring system
• Tanstack React Query — Efficient server state management
• Shadcn/UI + Radix — Accessible, customizable component library

Database: 16 production tables with full RLS policies
Edge Functions: Custom serverless functions for user management and AI
Authentication: Email/Password with verification and role-based routing

---

🎬 SCENE 8: CLOSING (15 seconds)
---
Final title card with dramatic animation:

"LearnX — Where Education Meets Innovation"
"Full-Stack • AI-Powered • Production-Ready"

"Built as a complete, deployable SaaS product demonstrating:
✅ Complex role-based architecture
✅ Real-time data with Supabase
✅ AI integration with Gemini
✅ Gamification & engagement features
✅ Enterprise-grade security with RLS
✅ Professional UI/UX design"

End with: "Designed & Developed by [Your Name]"

---

🎵 MUSIC & STYLE NOTES:
• Background music: Modern, upbeat electronic/tech music (royalty-free)
• Transitions: Smooth slide/fade transitions between scenes
• Text overlays: Clean, minimal white text on dark overlays
• Color scheme: Match the app's primary blue/purple gradient theme
• Pacing: Energetic but not rushed — let each feature breathe for 3-5 seconds
• Voice: Professional, confident narrator voice (male or female)
```

---

## 🎯 Quick Tips for Video Creation

| AI Video Tool | Best For |
|---|---|
| **Synthesia** | AI avatar presenter reading the script |
| **Pictory** | Convert this script to video with stock footage |
| **InVideo AI** | Paste this prompt directly for auto-generation |
| **HeyGen** | Professional avatar-based product demo |
| **CapCut** | Manual editing with screen recordings |

### 📹 Recommended Approach:
1. **Screen record** each section of the live app
2. Paste this prompt into **InVideo AI** or **Pictory**
3. Replace stock footage with your actual screen recordings
4. Add the suggested music and text overlays
5. Export in 1080p or 4K

---

> **Total Features Covered: 40+ unique functionalities across 3 roles**
> **Estimated Video Duration: 4-6 minutes**
> **Tone: Professional SaaS product demo — interview & portfolio ready**
