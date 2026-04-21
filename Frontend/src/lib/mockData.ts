export const studentProfile = {
  name: "Alex Chen",
  avatar: "AC",
  batch: "CS-2025-A",
  rank: 3,
  streak: 12,
  xp: 4850,
  level: 15,
};

export const statsCards = [
  { label: "Attendance", value: "92%", change: "+2.3%", trend: "up" as const, icon: "target" },
  { label: "Assignments Done", value: "18/22", change: "82%", trend: "up" as const, icon: "file" },
  { label: "Learning Streak", value: "12 days", change: "Best: 21", trend: "up" as const, icon: "zap" },
  { label: "Rank", value: "#3", change: "↑2 this week", trend: "up" as const, icon: "trophy" },
];

export const weeklyProgress = [
  { day: "Mon", hours: 3.5, tasks: 4 },
  { day: "Tue", hours: 4.2, tasks: 5 },
  { day: "Wed", hours: 2.8, tasks: 3 },
  { day: "Thu", hours: 5.1, tasks: 6 },
  { day: "Fri", hours: 3.9, tasks: 4 },
  { day: "Sat", hours: 1.5, tasks: 2 },
  { day: "Sun", hours: 2.0, tasks: 3 },
];

export const lectures = [
  { id: 1, title: "Introduction to Neural Networks", subject: "Deep Learning", instructor: "Dr. Sarah Kim", duration: "1h 20m", progress: 100, type: "recorded" as const, date: "2026-03-05", videoId: "aircAruvnKk" },
  { id: 2, title: "Backpropagation Deep Dive", subject: "Deep Learning", instructor: "Dr. Sarah Kim", duration: "55m", progress: 72, type: "recorded" as const, date: "2026-03-06", videoId: "Ilg3gGewQ5U" },
  { id: 3, title: "Data Structures: Trees & Graphs", subject: "DSA", instructor: "Prof. Raj Patel", duration: "1h 10m", progress: 45, type: "live" as const, date: "2026-03-08", videoId: "oSWTXtMglKE" },
  { id: 4, title: "System Design Fundamentals", subject: "System Design", instructor: "Prof. Li Wei", duration: "1h 30m", progress: 0, type: "recorded" as const, date: "2026-03-09", videoId: "F5mRW0jo-U4" },
  { id: 5, title: "React Advanced Patterns", subject: "Frontend Dev", instructor: "Ms. Emily Ross", duration: "50m", progress: 30, type: "recorded" as const, date: "2026-03-07", videoId: "J-g9ZJha8FE" },
  { id: 6, title: "Database Optimization", subject: "Backend Dev", instructor: "Dr. Mark Chen", duration: "1h 05m", progress: 0, type: "live" as const, date: "2026-03-10", videoId: "HG6yIjZNSiI" },
];

export const assignments = [
  { id: 1, title: "Build a CNN Classifier", subject: "Deep Learning", dueDate: "2026-03-10", status: "pending" as const, grade: null, feedback: null },
  { id: 2, title: "Binary Tree Operations", subject: "DSA", dueDate: "2026-03-07", status: "submitted" as const, grade: null, feedback: null },
  { id: 3, title: "REST API Design Doc", subject: "System Design", dueDate: "2026-03-04", status: "reviewed" as const, grade: "A", feedback: "Excellent architecture decisions" },
  { id: 4, title: "React Dashboard Component", subject: "Frontend Dev", dueDate: "2026-03-03", status: "reviewed" as const, grade: "A+", feedback: "Outstanding UI work" },
  { id: 5, title: "SQL Query Optimization", subject: "Backend Dev", dueDate: "2026-03-06", status: "late" as const, grade: null, feedback: null },
  { id: 6, title: "Implement Transformer Model", subject: "Deep Learning", dueDate: "2026-03-12", status: "pending" as const, grade: null, feedback: null },
];

export const leaderboard = [
  { rank: 1, name: "Maya Johnson", xp: 5200, streak: 18, avatar: "MJ", badge: "🏆" },
  { rank: 2, name: "Ryan Park", xp: 5050, streak: 15, avatar: "RP", badge: "🥈" },
  { rank: 3, name: "Alex Chen", xp: 4850, streak: 12, avatar: "AC", badge: "🥉", isYou: true },
  { rank: 4, name: "Priya Sharma", xp: 4600, streak: 10, avatar: "PS", badge: "" },
  { rank: 5, name: "James Wilson", xp: 4400, streak: 9, avatar: "JW", badge: "" },
  { rank: 6, name: "Sofia Martinez", xp: 4200, streak: 14, avatar: "SM", badge: "" },
  { rank: 7, name: "Liam O'Brien", xp: 4000, streak: 7, avatar: "LO", badge: "" },
  { rank: 8, name: "Zara Ahmed", xp: 3800, streak: 11, avatar: "ZA", badge: "" },
];

export const notifications = [
  { id: 1, type: "assignment" as const, title: "New Assignment: Implement Transformer Model", time: "2h ago", read: false },
  { id: 2, type: "lecture" as const, title: "Live class: Data Structures starts in 30 min", time: "30m ago", read: false },
  { id: 3, type: "sprint" as const, title: "Week 6 Sprint Plan released", time: "5h ago", read: false },
  { id: 4, type: "grade" as const, title: "Assignment graded: REST API Design Doc — A", time: "1d ago", read: true },
  { id: 5, type: "announcement" as const, title: "Campus hackathon registration open", time: "2d ago", read: true },
];

export const sprintTasks = [
  { id: 1, title: "Complete Neural Networks lecture", module: "Deep Learning", done: true },
  { id: 2, title: "Submit CNN Classifier assignment", module: "Deep Learning", done: false },
  { id: 3, title: "Watch Trees & Graphs lecture", module: "DSA", done: false },
  { id: 4, title: "Practice binary tree problems", module: "DSA", done: true },
  { id: 5, title: "Read System Design chapter 4", module: "System Design", done: true },
  { id: 6, title: "Build React dashboard component", module: "Frontend Dev", done: true },
  { id: 7, title: "Database optimization lecture", module: "Backend Dev", done: false },
];

export const performanceData = [
  { week: "W1", attendance: 95, assignments: 90, engagement: 85 },
  { week: "W2", attendance: 88, assignments: 95, engagement: 78 },
  { week: "W3", attendance: 92, assignments: 85, engagement: 90 },
  { week: "W4", attendance: 90, assignments: 100, engagement: 88 },
  { week: "W5", attendance: 95, assignments: 80, engagement: 92 },
  { week: "W6", attendance: 92, assignments: 88, engagement: 85 },
];
