import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Users, Calendar, Clock, User, Search, Filter, Plus } from "lucide-react";
import { api, getAccessToken } from "@/lib/backendApi";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface Teacher {
  _id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Class {
  id: string;
  name?: string;
  title: string;
  description?: string;
  teacher_id: string;
  teacher_name?: string;
  teacher_email?: string;
  batch?: string;
  schedule?: string;
  duration?: number;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

export default function Classes() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const { user } = useAuth();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const accessToken = getAccessToken();
      if (!accessToken) return;

      const response = await api<Class[]>("/api/classes", {
        method: "GET",
        accessToken,
      });

      if (response.status === 200 && response.data) {
        // Fetch teacher information for each class
        const classesWithTeachers = await Promise.all(
          response.data.map(async (cls) => {
            try {
              const teacherResponse = await api<Teacher>(`/api/users/${cls.teacher_id}`, {
                method: "GET",
                accessToken,
              });
              
              const teacherData = teacherResponse.status === 200 ? teacherResponse.data : null;
              
              return {
                ...cls,
                teacher_name: teacherData?.full_name || 'Unknown Teacher',
                teacher_email: teacherData?.email || '',
              };
            } catch (error) {
              console.error(`Failed to fetch teacher for class ${cls.id}:`, error);
              return {
                ...cls,
                teacher_name: 'Unknown Teacher',
                teacher_email: '',
              };
            }
          })
        );
        
        setClasses(classesWithTeachers);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = (cls.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cls.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cls.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cls.location?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterSubject === "all" || cls.batch === filterSubject;
    return matchesSearch && matchesFilter;
  });

  const subjects = [...new Set(classes.map(cls => cls.batch).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Classes</h1>
          <p className="text-muted-foreground mt-1">View and manage your enrolled classes</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border/20 bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border/20 bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/20 transition-all"
          >
            <option value="all">All Batches</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchQuery || filterSubject !== "all" ? "No classes found" : "No classes enrolled"}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery || filterSubject !== "all" 
              ? "Try adjusting your search or filter criteria"
              : "You haven't been enrolled in any classes yet"
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls, index) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-border/20 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                    {cls.batch || 'No Batch'}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cls.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {cls.description}
                    </p>
                  </div>

                  {/* Teacher Info */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{cls.teacher_name}</span>
                  </div>

                  {/* Schedule Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{cls.schedule ? new Date(cls.schedule).toLocaleString() : 'Not scheduled'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Location: {cls.location || 'TBD'}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border/10">
                    <div className={`w-2 h-2 rounded-full ${
                      cls.status === 'scheduled' ? 'bg-blue-500' :
                      cls.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="capitalize">{cls.status}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-4 rounded-xl border border-border/20 bg-card/50 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{classes.length}</p>
              <p className="text-sm text-muted-foreground">Total Classes</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="p-4 rounded-xl border border-border/20 bg-card/50 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {classes.filter(cls => cls.status === 'scheduled').length}
              </p>
              <p className="text-sm text-muted-foreground">Scheduled</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="p-4 rounded-xl border border-border/20 bg-card/50 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{subjects.length}</p>
              <p className="text-sm text-muted-foreground">Subjects</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="p-4 rounded-xl border border-border/20 bg-card/50 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">Active</p>
              <p className="text-sm text-muted-foreground">Status</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
