import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api, getAccessToken } from "@/lib/backendApi";
import {
  Users, BookOpen, CalendarCheck, TrendingUp, Search, Filter,
  UserCheck, UserX, Clock, Award, AlertCircle, ChevronDown,
  Download, Eye, BarChart3, FileText, CheckCircle, XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StudentProfile = {
  user_id: string;
  full_name: string | null;
  batch: string | null;
  avatar_url: string | null;
  class_name?: string | null;
  student_id?: string | null;
  is_approved?: boolean;
};

type AssignmentData = {
  id: string;
  title: string;
  max_score: number;
  submissions: {
    student_id: string;
    grade?: number;
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

type LectureData = {
  id: string;
  title: string;
  date: string;
  attendance: {
    student_id: string;
    attended: boolean;
  }[];
};

export default function StudentsReport() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceData>>({});
  const [lectures, setLectures] = useState<LectureData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const teacherClass = profile?.class_name || "";

  useEffect(() => {
    void fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      const token = getAccessToken();
      if (!token) return;

      // Fetch students
      const studentsRes = await api<any[]>(`/api/users/batch/${encodeURIComponent(teacherClass)}`, {
        method: "GET",
        accessToken: token,
      });

      if (studentsRes.status === 200 && studentsRes.data) {
        const studentsList = studentsRes.data
          .filter((u: any) => u.role === "student")
          .map((u: any) => ({
            user_id: String(u._id ?? u.id),
            full_name: u.name ?? null,
            batch: u.batch ?? u.assignedClass ?? null,
            avatar_url: u.avatar_url ?? null,
            class_name: u.assignedClass ?? teacherClass,
            student_id: u.studentId ?? u.student_id ?? null,
            is_approved: u.is_approved ?? true,
          })) as StudentProfile[];
        setStudents(studentsList);
      }

      // Fetch assignments with submissions
      const assignmentsRes = await api<any[]>(`/api/assignments`, {
        method: "GET",
        accessToken: token,
      });

      if (assignmentsRes.status === 200 && assignmentsRes.data) {
        const assignmentsWithData = await Promise.all(
          assignmentsRes.data.map(async (assignment: any) => {
            const submissionsRes = await api<any[]>(`/api/assignments/${assignment.id}/submissions`, {
              method: "GET",
              accessToken: token,
            });
            
            return {
              id: assignment.id,
              title: assignment.title,
              max_score: assignment.max_score || 100,
              submissions: submissionsRes.status === 200 && submissionsRes.data ? submissionsRes.data : []
            };
          })
        );
        setAssignments(assignmentsWithData);
      }

      // Fetch attendance data
      const attendanceRes = await api<any[]>(`/api/attendance/teacher/${user?.id}`, {
        method: "GET",
        accessToken: token,
      });

      if (attendanceRes.status === 200 && attendanceRes.data) {
        const attendanceMap: Record<string, AttendanceData> = {};
        students.forEach(student => {
          const studentAttendance = attendanceRes.data.filter((att: any) => att.student_id === student.user_id);
          const totalClasses = studentAttendance.length;
          const present = studentAttendance.filter((att: any) => att.status === "present").length;
          const absent = studentAttendance.filter((att: any) => att.status === "absent").length;
          const late = studentAttendance.filter((att: any) => att.status === "late").length;
          
          attendanceMap[student.user_id] = {
            student_id: student.user_id,
            total_classes: totalClasses,
            present,
            absent,
            late,
            percentage: totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0
          };
        });
        setAttendanceData(attendanceMap);
      }

      // Fetch lectures
      const lecturesRes = await api<any[]>(`/api/lectures?teacher_id=${encodeURIComponent(user!.id)}`, {
        method: "GET",
        accessToken: token,
      });

      if (lecturesRes.status === 200 && lecturesRes.data) {
        setLectures(lecturesRes.data);
      }

    } catch (error) {
      console.error("Failed to fetch students report data:", error);
      toast.error("Failed to load students data");
    } finally {
      setLoading(false);
    }
  }

  function getStudentAssignments(studentId: string) {
    return assignments.map(assignment => {
      const submission = assignment.submissions.find(sub => sub.student_id === studentId);
      return {
        ...assignment,
        submission,
        status: submission ? submission.status : "not_submitted",
        grade: submission?.grade
      };
    });
  }

  function getStudentStats(studentId: string) {
    const studentAssignments = getStudentAssignments(studentId);
    const submitted = studentAssignments.filter(a => a.submission).length;
    const graded = studentAssignments.filter(a => a.grade !== undefined).length;
    const avgGrade = graded > 0 
      ? Math.round(studentAssignments.reduce((sum, a) => sum + (a.grade || 0), 0) / graded)
      : 0;

    return {
      totalAssignments: studentAssignments.length,
      submitted,
      graded,
      avgGrade,
      attendance: attendanceData[studentId] || {
        total_classes: 0,
        present: 0,
        absent: 0,
        late: 0,
        percentage: 0
      }
    };
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchQuery || 
      student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = selectedBatch === "all" || student.batch === selectedBatch;
    return matchesSearch && matchesBatch;
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
          <h1 className="text-3xl font-bold text-foreground">Students Report</h1>
          <p className="text-muted-foreground">Comprehensive view of student performance and engagement</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <CalendarCheck className="w-5 h-5 text-green-600 dark:text-green-300" />
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
                <Award className="w-5 h-5 text-orange-600 dark:text-orange-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {students.filter(s => getStudentStats(s.user_id).avgGrade >= 80).length}
                </p>
                <p className="text-sm text-muted-foreground">Top Performers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <p className="text-sm text-muted-foreground">ID: {selectedStudent.student_id} | Batch: {selectedStudent.batch}</p>
              </div>
            </div>
            <Badge variant={selectedStudent.is_approved ? "default" : "secondary"}>
              {selectedStudent.is_approved ? "Active" : "Pending"}
            </Badge>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="lectures">Lectures</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                              <span>{stats.submitted}/{stats.totalAssignments}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Graded:</span>
                              <span>{stats.graded}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Avg Grade:</span>
                              <span className="font-semibold">{stats.avgGrade}%</span>
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
                          <BookOpen className="w-3 h-3 text-muted-foreground" />
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
                            <p className="text-sm text-muted-foreground">Max Score: {assignment.max_score}</p>
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

              <TabsContent value="lectures" className="space-y-4">
                <div className="space-y-3">
                  {lectures.map(lecture => {
                    const attended = lecture.attendance?.find(a => a.student_id === selectedStudent.user_id)?.attended;
                    return (
                      <Card key={lecture.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{lecture.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(lecture.date).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={attended ? "default" : "secondary"}>
                              {attended ? "Attended" : "Not Attended"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        /* Students List */
        <Card>
          <CardHeader>
            <CardTitle>Students List</CardTitle>
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
                            ID: {student.student_id} | {student.batch}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{stats.avgGrade}%</p>
                          <p className="text-xs text-muted-foreground">Avg Grade</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{stats.attendance.percentage}%</p>
                          <p className="text-xs text-muted-foreground">Attendance</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{stats.submitted}/{stats.totalAssignments}</p>
                          <p className="text-xs text-muted-foreground">Assignments</p>
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
                  No students found matching the filters
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
