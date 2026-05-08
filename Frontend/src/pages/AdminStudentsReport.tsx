import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api, getAccessToken } from "@/lib/backendApi";
import {
  Users, BookOpen, CalendarCheck, TrendingUp, Search, Filter,
  UserCheck, UserX, Clock, Award, AlertCircle, ChevronDown,
  Download, Eye, BarChart3, FileText, CheckCircle, XCircle,
  GraduationCap, School, UserCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TeacherData = {
  id: string;
  full_name: string;
  email: string;
  class_name?: string;
  batch?: string;
};

type StudentProfile = {
  user_id: string;
  full_name: string | null;
  batch: string | null;
  avatar_url: string | null;
  class_name?: string | null;
  student_id?: string | null;
  is_approved?: boolean;
  teacher_id?: string;
  teacher_name?: string;
};

type AssignmentData = {
  id: string;
  title: string;
  max_score: number;
  teacher_id: string;
  teacher_name: string;
  batch: string;
  submissions: {
    student_id: string;
    grade?: number;
    submitted_at: string;
    status: string;
  }[];
};

type ExamData = {
  id: string;
  title: string;
  teacher_id: string;
  teacher_name: string;
  batch: string;
  max_score: number;
  submissions: {
    student_id: string;
    score?: number;
    submitted_at: string;
    status: string;
  }[];
};

type AttendanceData = {
  student_id: string;
  total_classes: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
};

export default function AdminStudentsReport() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [exams, setExams] = useState<ExamData[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceData>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    void fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      const token = getAccessToken();
      if (!token) return;

      // Fetch all teachers
      const teachersRes = await api<any[]>(`/api/users?role=teacher`, {
        method: "GET",
        accessToken: token,
      });

      if (teachersRes.status === 200 && teachersRes.data) {
        const teachersList = teachersRes.data.map((teacher: any) => ({
          id: String(teacher._id ?? teacher.id),
          full_name: teacher.name || teacher.full_name,
          email: teacher.email,
          class_name: teacher.class_name,
          batch: teacher.batch
        }));
        setTeachers(teachersList);
      }

      // Fetch all students
      const studentsRes = await api<any[]>(`/api/users?role=student`, {
        method: "GET",
        accessToken: token,
      });

      if (studentsRes.status === 200 && studentsRes.data) {
        const studentsList = studentsRes.data.map((student: any) => ({
          user_id: String(student._id ?? student.id),
          full_name: student.name || student.full_name,
          batch: student.batch || student.assignedClass,
          avatar_url: student.avatar_url,
          class_name: student.assignedClass,
          student_id: student.studentId || student.student_id,
          is_approved: student.is_approved,
          teacher_id: student.teacher_id,
          teacher_name: student.teacher_name
        }));
        setStudents(studentsList);
      }

      // Fetch all assignments with teacher info
      const assignmentsRes = await api<any[]>(`/api/assignments`, {
        method: "GET",
        accessToken: token,
      });

      if (assignmentsRes.status === 200 && assignmentsRes.data) {
        const assignmentsWithData = await Promise.all(
          assignmentsRes.data.map(async (assignment: any) => {
            // Get teacher info
            const teacherRes = await api<TeacherData>(`/api/users/${assignment.teacher_id}`, {
              method: "GET",
              accessToken: token,
            });
            
            const teacherName = teacherRes.status === 200 && teacherRes.data 
              ? teacherRes.data.full_name 
              : 'Unknown Teacher';

            // Get submissions
            const submissionsRes = await api<any[]>(`/api/assignments/${assignment.id}/submissions`, {
              method: "GET",
              accessToken: token,
            });
            
            return {
              id: assignment.id,
              title: assignment.title,
              max_score: assignment.max_score || 100,
              teacher_id: assignment.teacher_id,
              teacher_name: teacherName,
              batch: assignment.batch,
              submissions: submissionsRes.status === 200 && submissionsRes.data ? submissionsRes.data : []
            };
          })
        );
        setAssignments(assignmentsWithData);
      }

      // Fetch all exams with teacher info
      const examsRes = await api<any[]>(`/api/exams`, {
        method: "GET",
        accessToken: token,
      });

      if (examsRes.status === 200 && examsRes.data) {
        const examsWithData = await Promise.all(
          examsRes.data.map(async (exam: any) => {
            // Get teacher info
            const teacherRes = await api<TeacherData>(`/api/users/${exam.teacher_id}`, {
              method: "GET",
              accessToken: token,
            });
            
            const teacherName = teacherRes.status === 200 && teacherRes.data 
              ? teacherRes.data.full_name 
              : 'Unknown Teacher';

            // Get submissions
            const submissionsRes = await api<any[]>(`/api/exams/${exam.id}/submissions`, {
              method: "GET",
              accessToken: token,
            });
            
            return {
              id: exam.id,
              title: exam.title,
              teacher_id: exam.teacher_id,
              teacher_name: teacherName,
              batch: exam.batch,
              max_score: exam.max_score || 100,
              submissions: submissionsRes.status === 200 && submissionsRes.data ? submissionsRes.data : []
            };
          })
        );
        setExams(examsWithData);
      }

      // Fetch attendance data for all students
      const attendancePromises = students.map(async (student: any) => {
        const attendanceRes = await api<any[]>(`/api/attendance/student/${student._id || student.id}`, {
          method: "GET",
          accessToken: token,
        });
        
        const attendance = attendanceRes.status === 200 && attendanceRes.data ? attendanceRes.data : [];
        const totalClasses = attendance.length;
        const present = attendance.filter((att: any) => att.status === "present").length;
        const absent = attendance.filter((att: any) => att.status === "absent").length;
        const late = attendance.filter((att: any) => att.status === "late").length;
        
        return {
          student_id: String(student._id ?? student.id),
          total_classes: totalClasses,
          present,
          absent,
          late,
          percentage: totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0
        };
      });

      const attendanceResults = await Promise.all(attendancePromises);
      const attendanceMap: Record<string, AttendanceData> = {};
      attendanceResults.forEach(result => {
        attendanceMap[result.student_id] = result;
      });
      setAttendanceData(attendanceMap);

    } catch (error) {
      console.error("Failed to fetch admin students report data:", error);
      toast.error("Failed to load students data");
    } finally {
      setLoading(false);
    }
  }

  function getStudentAssignments(studentId: string) {
    return assignments.filter(assignment => 
      assignment.submissions.some(sub => sub.student_id === studentId)
    ).map(assignment => {
      const submission = assignment.submissions.find(sub => sub.student_id === studentId);
      return {
        ...assignment,
        submission,
        status: submission ? submission.status : "not_submitted",
        grade: submission?.grade
      };
    });
  }

  function getStudentExams(studentId: string) {
    return exams.filter(exam => 
      exam.submissions.some(sub => sub.student_id === studentId)
    ).map(exam => {
      const submission = exam.submissions.find(sub => sub.student_id === studentId);
      return {
        ...exam,
        submission,
        status: submission ? submission.status : "not_taken",
        score: submission?.score
      };
    });
  }

  function getStudentStats(studentId: string) {
    const studentAssignments = getStudentAssignments(studentId);
    const studentExams = getStudentExams(studentId);
    
    const assignmentSubmitted = studentAssignments.filter(a => a.submission).length;
    const assignmentGraded = studentAssignments.filter(a => a.grade !== undefined).length;
    const avgAssignmentGrade = assignmentGraded > 0 
      ? Math.round(studentAssignments.reduce((sum, a) => sum + (a.grade || 0), 0) / assignmentGraded)
      : 0;

    const examTaken = studentExams.filter(e => e.submission).length;
    const examGraded = studentExams.filter(e => e.score !== undefined).length;
    const avgExamScore = examGraded > 0 
      ? Math.round(studentExams.reduce((sum, e) => sum + (e.score || 0), 0) / examGraded)
      : 0;

    return {
      totalAssignments: assignments.filter(a => 
        students.some(s => s.user_id === studentId && s.batch === a.batch)
      ).length,
      assignmentSubmitted,
      assignmentGraded,
      avgAssignmentGrade,
      totalExams: exams.filter(e => 
        students.some(s => s.user_id === studentId && s.batch === e.batch)
      ).length,
      examTaken,
      examGraded,
      avgExamScore,
      attendance: attendanceData[studentId] || {
        total_classes: 0,
        present: 0,
        absent: 0,
        late: 0,
        percentage: 0
      }
    };
  }

  function getTeacherStats(teacherId: string) {
    const teacherStudents = students.filter(s => s.teacher_id === teacherId);
    const teacherAssignments = assignments.filter(a => a.teacher_id === teacherId);
    const teacherExams = exams.filter(e => e.teacher_id === teacherId);

    const totalAssignmentSubmissions = teacherAssignments.reduce((sum, a) => sum + a.submissions.length, 0);
    const totalExamSubmissions = teacherExams.reduce((sum, e) => sum + e.submissions.length, 0);

    return {
      totalStudents: teacherStudents.length,
      totalAssignments: teacherAssignments.length,
      totalExams: teacherExams.length,
      assignmentSubmissions: totalAssignmentSubmissions,
      examSubmissions: totalExamSubmissions,
      avgStudentPerformance: teacherStudents.length > 0 
        ? Math.round(
            teacherStudents.reduce((sum, s) => sum + getStudentStats(s.user_id).avgAssignmentGrade, 0) / teacherStudents.length
          )
        : 0
    };
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchQuery || 
      student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeacher = selectedTeacher === "all" || student.teacher_id === selectedTeacher;
    const matchesBatch = selectedBatch === "all" || student.batch === selectedBatch;
    return matchesSearch && matchesTeacher && matchesBatch;
  });

  const uniqueBatches = Array.from(new Set(students.map(s => s.batch).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading students report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Students Report</h1>
          <p className="text-muted-foreground">Comprehensive view of all student performance and teacher activities</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teachers</SelectItem>
                {teachers.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>{teacher.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {uniqueBatches.map(batch => (
                  <SelectItem key={batch} value={batch}>{batch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teachers.length}</p>
                <p className="text-sm text-muted-foreground">Total Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments.length}</p>
                <p className="text-sm text-muted-foreground">Total Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <BookOpen className="w-5 h-5 text-orange-600 dark:text-orange-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{exams.length}</p>
                <p className="text-sm text-muted-foreground">Total Exams</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                <CalendarCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(students.reduce((sum, s) => sum + (attendanceData[s.user_id]?.percentage || 0), 0) / students.length)}%
                </p>
                <p className="text-sm text-muted-foreground">Avg Attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teacher Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teachers.map(teacher => {
              const stats = getTeacherStats(teacher.id);
              return (
                <div key={teacher.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                        {teacher.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium">{teacher.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{teacher.email}</p>
                        <p className="text-sm text-muted-foreground">Class: {teacher.class_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                      <div>
                        <p className="text-lg font-semibold">{stats.totalStudents}</p>
                        <p className="text-xs text-muted-foreground">Students</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{stats.totalAssignments}</p>
                        <p className="text-xs text-muted-foreground">Assignments</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{stats.totalExams}</p>
                        <p className="text-xs text-muted-foreground">Exams</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{stats.assignmentSubmissions}</p>
                        <p className="text-xs text-muted-foreground">Submissions</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{stats.avgStudentPerformance}%</p>
                        <p className="text-xs text-muted-foreground">Avg Performance</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Student Details or Students List */}
      {selectedStudent ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStudent(null)}
                className="gap-2"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
                Back to List
              </Button>
              <div>
                <CardTitle className="text-xl">{selectedStudent.full_name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  ID: {selectedStudent.student_id} | Batch: {selectedStudent.batch} | 
                  Teacher: {selectedStudent.teacher_name || 'Not Assigned'}
                </p>
              </div>
            </div>
            <Badge variant={selectedStudent.is_approved ? "default" : "secondary"}>
              {selectedStudent.is_approved ? "Active" : "Pending"}
            </Badge>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="exams">Exams</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Assignment Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const stats = getStudentStats(selectedStudent.user_id);
                        return (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Submitted:</span>
                              <span>{stats.assignmentSubmitted}/{stats.totalAssignments}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Graded:</span>
                              <span>{stats.assignmentGraded}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Avg Grade:</span>
                              <span className="font-semibold">{stats.avgAssignmentGrade}%</span>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Exam Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const stats = getStudentStats(selectedStudent.user_id);
                        return (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Taken:</span>
                              <span>{stats.examTaken}/{stats.totalExams}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Graded:</span>
                              <span>{stats.examGraded}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Avg Score:</span>
                              <span className="font-semibold">{stats.avgExamScore}%</span>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Attendance Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const attendance = attendanceData[selectedStudent.user_id];
                        if (!attendance) {
                          return <p className="text-sm text-muted-foreground">No attendance data</p>;
                        }
                        return (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Present:</span>
                              <span className="text-green-600">{attendance.present}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Absent:</span>
                              <span className="text-red-600">{attendance.absent}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Late:</span>
                              <span className="text-yellow-600">{attendance.late}</span>
                            </div>
                            <div className="flex justify-between text-sm font-semibold">
                              <span>Percentage:</span>
                              <span>{attendance.percentage}%</span>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${selectedStudent.is_approved ? "bg-green-500" : "bg-yellow-500"}`} />
                          <span className="text-sm">
                            {selectedStudent.is_approved ? "Approved" : "Pending Approval"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserCircle className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{selectedStudent.teacher_name || 'Not Assigned'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <School className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{selectedStudent.batch}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="assignments" className="space-y-4">
                <div className="space-y-3">
                  {getStudentAssignments(selectedStudent.user_id).map(assignment => (
                    <Card key={assignment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{assignment.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Teacher: {assignment.teacher_name} | Max Score: {assignment.max_score}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={
                                assignment.status === "graded" ? "default" :
                                assignment.status === "submitted" ? "secondary" :
                                "destructive"
                              }
                            >
                              {assignment.status.replace("_", " ")}
                            </Badge>
                            {assignment.grade !== undefined && (
                              <p className="text-sm font-semibold mt-1">Grade: {assignment.grade}/{assignment.max_score}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="exams" className="space-y-4">
                <div className="space-y-3">
                  {getStudentExams(selectedStudent.user_id).map(exam => (
                    <Card key={exam.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{exam.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Teacher: {exam.teacher_name} | Max Score: {exam.max_score}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={
                                exam.status === "graded" ? "default" :
                                exam.status === "submitted" ? "secondary" :
                                "destructive"
                              }
                            >
                              {exam.status.replace("_", " ")}
                            </Badge>
                            {exam.score !== undefined && (
                              <p className="text-sm font-semibold mt-1">Score: {exam.score}/{exam.max_score}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="attendance" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    {(() => {
                      const attendance = attendanceData[selectedStudent.user_id];
                      if (!attendance) {
                        return <p className="text-center text-muted-foreground">No attendance data available</p>;
                      }
                      return (
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className="text-4xl font-bold mb-2">{attendance.percentage}%</div>
                            <p className="text-muted-foreground">Overall Attendance</p>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-green-600">{attendance.present}</div>
                              <p className="text-sm text-muted-foreground">Present</p>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-red-600">{attendance.absent}</div>
                              <p className="text-sm text-muted-foreground">Absent</p>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-yellow-600">{attendance.late}</div>
                              <p className="text-sm text-muted-foreground">Late</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Assignment Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const stats = getStudentStats(selectedStudent.user_id);
                        const submissionRate = stats.totalAssignments > 0 
                          ? Math.round((stats.assignmentSubmitted / stats.totalAssignments) * 100)
                          : 0;
                        return (
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Submission Rate</span>
                                <span>{submissionRate}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ width: `${submissionRate}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Grading Rate</span>
                                <span>{stats.totalAssignments > 0 ? Math.round((stats.assignmentGraded / stats.totalAssignments) * 100) : 0}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ width: `${stats.totalAssignments > 0 ? Math.round((stats.assignmentGraded / stats.totalAssignments) * 100) : 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Exam Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const stats = getStudentStats(selectedStudent.user_id);
                        const examRate = stats.totalExams > 0 
                          ? Math.round((stats.examTaken / stats.totalExams) * 100)
                          : 0;
                        return (
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Exam Participation</span>
                                <span>{examRate}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-purple-500 h-2 rounded-full" 
                                  style={{ width: `${examRate}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Average Score</span>
                                <span>{stats.avgExamScore}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-orange-500 h-2 rounded-full" 
                                  style={{ width: `${stats.avgExamScore}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        /* Students List */
        <Card>
          <CardHeader>
            <CardTitle>All Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredStudents.map(student => {
                const stats = getStudentStats(student.user_id);
                return (
                  <motion.div
                    key={student.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {student.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-medium">{student.full_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            ID: {student.student_id} | {student.batch} | Teacher: {student.teacher_name || 'Not Assigned'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{stats.avgAssignmentGrade}%</p>
                          <p className="text-xs text-muted-foreground">Assignments</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{stats.avgExamScore}%</p>
                          <p className="text-xs text-muted-foreground">Exams</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{stats.attendance.percentage}%</p>
                          <p className="text-xs text-muted-foreground">Attendance</p>
                        </div>
                        <Badge variant={student.is_approved ? "default" : "secondary"}>
                          {student.is_approved ? "Active" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {filteredStudents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No students found matching filters
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
