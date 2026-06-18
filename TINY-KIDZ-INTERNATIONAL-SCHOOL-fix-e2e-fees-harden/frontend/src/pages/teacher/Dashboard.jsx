// src/pages/teacher/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Box,
  Skeleton,
} from "@mui/material";
import axios from "axios";
import { getAuthToken } from "../../utils/authSession";
import { logout } from "../../redux/authSlice";
import API_BASE from "../../utils/apiConfig";

// --- API Configuration ---
const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
  
    // --- State ---
    const [loading, setLoading] = useState(true);
    const [teacher, setTeacher] = useState(null);
    const [classes, setClasses] = useState([]);
    const [todayAttendance, setTodayAttendance] = useState([]);
    const [recentHomework, setRecentHomework] = useState([]);
    const [latestNotices, setLatestNotices] = useState([]);
  
    // --- Helpers ---
    const formatDate = () => {
      // Use current date for display
      return new Date().toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    // --- Fetch Data ---
    useEffect(() => {
      const fetchDashboardData = async () => {
        try {
          // 1. Fetch Teacher Profile & Classes from real API
          const res = await api.get("/teachers/me");
          const data = res.data?.data || {};

          const teacherData = {
            name: data.userId?.name || "Teacher",
          };
          // assignedClasses is populated with { _id, className, section, academicYear, studentCount }
          const assigned = data.assignedClasses || data.classIds || [];
          const classesData = assigned.map(c => ({
            _id: c._id || c.id,
            name: `${c.className}-${c.section}`,
            studentsCount: c.studentCount || 0,
            role: "Class Teacher",
            className: c.className,
            section: c.section,
          }));

          setTeacher(teacherData);
          setClasses(classesData);


          // 2. Fetch today's attendance status for each class
          const today = new Date().toISOString().split("T")[0];
          const attendanceStatuses = await Promise.all(
            classesData.map(async (cls) => {
              try {
                const attRes = await api.get(`/attendance/class/${cls._id}/date/${today}`);
                const hasRecords = attRes.data?.data?.records?.length > 0 || false;
                return { classId: cls._id, className: cls.name, status: hasRecords ? "Marked" : "Pending" };
              } catch {
                return { classId: cls._id, className: cls.name, status: "Pending" };
              }
            })
          );
          setTodayAttendance(attendanceStatuses);

          // 3. Fetch recent homework (all classes)
          try {
            const hwRes = await api.get("/homework?assignedBy=me&limit=3");
            const hwData = hwRes.data?.data || hwRes.data || [];
            const formatted = (Array.isArray(hwData) ? hwData : []).map(hw => ({
              _id: hw._id,
              title: hw.title,
              className: hw.className || "",
              subTitle: hw.subject || "",
              dueDate: new Date(hw.dueDate),
              priority: new Date(hw.dueDate) < new Date() ? "Overdue" : "Standard"
            }));
            setRecentHomework(formatted);
          } catch {
            setRecentHomework([]);
          }

          // 4. Fetch Notices
          try {
            const notRes = await api.get("/notices?limit=3");
            const notices = notRes.data?.data || notRes.data || [];
            const formatted = (Array.isArray(notices) ? notices : []).map(n => ({
              _id: n._id,
              title: n.title,
              desc: n.message || n.content || "",
              time: new Date(n.createdAt).toLocaleDateString("en-IN"),
              urgent: n.priority === "High" || n.urgent || false,
            }));
            setLatestNotices(formatted);
          } catch {
            setLatestNotices([]);
          }

        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setTimeout(() => setLoading(false), 400);
        }
      };

      fetchDashboardData();
    }, []);


    if (loading) {
        return (
            <Box sx={{ ml: { sm: "240px" }, mt: "64px", p: 3 }}>
                <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Box>
        )
    }

    // --- Using Tailwind Classes with Red Theme ---
    return (
        <div className="flex bg-background min-h-screen font-body text-gray-900">
             {/* --- Sidebar --- */}
            <aside className="hidden md:flex flex-col h-screen w-64 bg-white border-r border-gray-100 py-6 fixed left-0 top-0 z-50 overflow-y-auto">
                <div className="px-6 mb-10 flex items-center gap-3">
                    <img src="/logo.png" alt="Tiny Kidz" className="h-10 w-auto object-contain" />
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-primary-dark leading-tight">Tiny Kidz</h1>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Teacher Portal</p>
                    </div>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <Link to="/teacher/dashboard" className="flex items-center gap-3 px-4 py-3 text-primary font-semibold bg-red-50 rounded-xl transition-colors">
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="font-label">Dashboard</span>
                    </Link>
                    <Link to="/teacher/attendance" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors rounded-xl">
                        <span className="material-symbols-outlined">how_to_reg</span>
                        <span className="font-label">Attendance</span>
                    </Link>
                    <Link to="/teacher/classes" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors rounded-xl">
                        <span className="material-symbols-outlined">groups</span>
                        <span className="font-label">Classes</span>
                    </Link>
                    <Link to="/teacher/homework" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors rounded-xl">
                        <span className="material-symbols-outlined">assignment</span>
                        <span className="font-label">Homework</span>
                    </Link>
                    <Link to="/teacher/marks" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors rounded-xl">
                        <span className="material-symbols-outlined">grading</span>
                        <span className="font-label">Marks</span>
                    </Link>
                    <Link to="/teacher/notices" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors rounded-xl">
                        <span className="material-symbols-outlined">campaign</span>
                        <span className="font-label">Notices</span>
                    </Link>
                    <Link to="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors rounded-xl">
                        <span className="material-symbols-outlined">settings</span>
                        <span className="font-label">Settings</span>
                    </Link>
                </nav>
                <div className="px-4 mt-auto">
                    <button onClick={() => { dispatch(logout()); navigate('/login'); }} className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-red-50 hover:text-red-700 transition-colors rounded-xl w-full text-left">
                        <span className="material-symbols-outlined">logout</span>
                        <span className="font-label">Logout</span>
                    </button>
                </div>
            </aside>
            
            {/* --- Main Content --- */}
            <main className="flex-1 ml-0 md:ml-64 bg-background min-h-screen pt-28 pr-6 pl-6 pb-20 md:pb-6 transition-all duration-300">
            
            {/* Top Header (Search & Profile) */}
            <header className="flex justify-between items-center px-8 h-20 w-full fixed top-0 z-40 bg-white/80 backdrop-blur-md md:left-64 md:w-[calc(100%-16rem)] shadow-sm transition-all duration-300 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined" style={{ fontSize: '20px' }}>search</span>
                        <input className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-primary/40 w-64 text-sm" placeholder="Search students, records..." type="text" />
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden lg:flex items-center gap-6 mr-6">
                        <a className="text-gray-500 hover:text-primary font-medium text-sm" href="#">Schedules</a>
                        <a className="text-gray-500 hover:text-primary font-medium text-sm" href="#">Reports</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                            <span className="material-symbols-outlined">mail</span>
                        </button>
                        <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center overflow-hidden ml-2 cursor-pointer border-2 border-white shadow-sm">
                            <img alt="Profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCm-sWr7ExBEXXCIiyZgRGfX2h6xZ9w3ikMTTO-4t21bQrD6Cm_1Q_G6g6DbCGhWbNxpSXsYtm8c9zY7YXsJ6fCTMUg8QljKoXCkNiFctrgdAywXcvr6tgktAX7ns5YvXrF4x64MIV44vWEuGfLznOGOidGLN0wE1jxwQLQ0YDXeVB5MqVj8il6d3NfIwH7b7hNUMO7ouKmr2cV3ZCmfyuRSOWUAW-MY8uihhytNmHTai0YEHk5kbZYD-cVA6RRYOVuJvooxs4WPA" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Custom Styles for specific components that need more fine-tuning */}
            <style>{`
                .editorial-shadow { box-shadow: 0 4px 24px rgba(13, 29, 41, 0.04); }
                .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(13, 29, 41, 0.08); }
                .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
            `}</style>

            {/* --- Hero Greeting Section --- */}
            <section className="mb-10">
                <h2 className="font-headline text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                    Good Morning, <span className="text-primary">{teacher?.name?.split(" ")[0] || "Teacher"}</span>
                </h2>
                <p className="text-gray-500 mt-2 text-lg">
                    Tiny Kidz International School | {formatDate()}
                </p>
            </section>

            {/* --- Metrics Grid --- */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {/* Metric 1 */}
                <div className="bg-white p-6 rounded-xl editorial-shadow flex flex-col justify-between border-l-4 border-primary card-hover transition-all duration-200">
                    <span className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-2">My Classes</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">{classes.length.toString().padStart(2, '0')}</span>
                        <span className="text-sm text-gray-500">Scheduled</span>
                    </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white p-6 rounded-xl editorial-shadow flex flex-col justify-between border-l-4 border-secondary card-hover transition-all duration-200">
                    <span className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-2">Attendance Pending</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">
                         {todayAttendance.filter(c => c.status === "Pending").length.toString().padStart(2, '0')}
                        </span>
                        <span className="text-sm text-secondary font-medium">Action Required</span>
                    </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white p-6 rounded-xl editorial-shadow flex flex-col justify-between border-l-4 border-green-600 card-hover transition-all duration-200">
                    <span className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-2">Homework Active</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">14</span>
                        <span className="text-sm text-gray-500">Submissions</span>
                    </div>
                </div>

                {/* Metric 4 */}
                <div className="bg-white p-6 rounded-xl editorial-shadow flex flex-col justify-between border-l-4 border-gray-400 card-hover transition-all duration-200">
                    <span className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-2">Unread Notices</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">05</span>
                        <span className="text-sm text-gray-500">Internal</span>
                    </div>
                </div>
            </section>

             {/* --- Main Layout Grid --- */}
            <div className="grid grid-cols-12 gap-8">
                
                {/* Center Column: Classes & Homework */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    
                    {/* My Classes Bento */}
                    <div className="bg-blue-50/50 p-8 rounded-xl border border-blue-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-headline text-xl font-bold text-gray-900">Current Classes</h3>
                            <button className="text-primary font-semibold text-sm hover:underline cursor-pointer">View All Schedule</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Class Cards */}
                            {classes.map((cls) => {
                                const status = todayAttendance.find(t => t.classId === cls._id)?.status || "Pending";
                                return (
                                <div key={cls._id} className="bg-white p-5 rounded-xl editorial-shadow card-hover transition-all duration-200 cursor-pointer" onClick={() => navigate(`/teacher/attendance?classId=${cls._id}`)}> 
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-lg font-bold text-primary">{cls.name}</span>
                                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                                            status === "Marked" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                        }`}>
                                            {status}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Students</span>
                                            <span className="font-semibold text-gray-900">{cls.studentsCount}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Role</span>
                                            <span className="font-semibold text-gray-500 text-xs">{cls.role === "Class Teacher" ? "Class Tchr" : "Subject Tchr"}</span>
                                        </div>
                                    </div>
                                </div>
                            )})}
                            
                            {/* Action Card */}
                            <div className="bg-white p-5 rounded-xl editorial-shadow border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-all duration-200">
                                <span className="text-lg font-bold text-primary">5-A</span>
                                <p className="text-xs text-gray-500 mt-1">Starts at 11:30 AM</p>
                                <button className="mt-4 text-xs font-bold text-primary uppercase tracking-wider">Prepare Content</button>
                            </div>
                        </div>
                    </div>

                    {/* Recent Homework */}
                    <div className="bg-white p-8 rounded-xl editorial-shadow">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-headline text-xl font-bold text-gray-900">Recent Homework</h3>
                            <div className="flex gap-2">
                                <button onClick={() => navigate('/teacher/homework')} className="px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-full text-xs font-semibold shadow-sm transition-all duration-200">Add New</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                             {recentHomework.map((hw) => (
                                <div key={hw._id} className="flex items-center justify-between py-4 group hover:bg-gray-50 px-4 rounded-xl transition-all duration-200 cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center 
                                            ${hw.title.includes("Math") ? "bg-blue-100 text-blue-700" : 
                                              hw.title.includes("English") ? "bg-green-100 text-green-800" : 
                                              "bg-red-100 text-red-800"}`}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                                                {hw.title.includes("Math") ? "calculate" : hw.title.includes("English") ? "history_edu" : "palette"}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{hw.title}</h4>
                                            <p className="text-xs text-gray-500">Class {hw.className} • {hw.subTitle}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-sm font-semibold text-gray-900">
                                            {hw.dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase ${hw.priority === 'Critical' ? 'text-red-600' : 'text-gray-500'}`}>
                                            {hw.priority}
                                        </span>
                                    </div>
                                </div>
                             ))}
                        </div>
                    </div>

                </div>

                {/* Right Sidebar: Widgets & Feed */}
                <div className="col-span-12 lg:col-span-4 space-y-8">
                    
                    {/* Quick Actions */}
                    <div className="bg-primary p-6 rounded-xl text-white relative overflow-hidden shadow-lg">
                        <div className="relative z-10">
                            <h3 className="font-headline text-lg font-bold mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <button onClick={() => navigate('/teacher/attendance')} className="flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all w-full text-left">
                                    <span className="material-symbols-outlined">how_to_reg</span>
                                    <span className="font-medium">Mark Attendance</span>
                                </button>
                                <button onClick={() => navigate('/teacher/homework')} className="flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all w-full text-left">
                                    <span className="material-symbols-outlined">post_add</span>
                                    <span className="font-medium">Assign Homework</span>
                                </button>
                                <button onClick={() => navigate('/teacher/marks')} className="flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all w-full text-left">
                                    <span className="material-symbols-outlined">grade</span>
                                    <span className="font-medium">Add Marks</span>
                                </button>
                            </div>
                        </div>
                        {/* Decoration */}
                        <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-white/10 rounded-full blur-2xl"></div>
                    </div>

                    {/* Attendance Widget */}
                     <div className="bg-blue-50 p-8 rounded-xl">
                        <h3 className="font-headline text-lg font-bold text-gray-900 mb-6">Attendance Status</h3>
                        {/* Simple Attendance Donut Visualization */}
                        <div className="flex flex-col items-center justify-center mb-6">
                             <div className="relative w-32 h-32 rounded-full border-8 border-white flex items-center justify-center bg-blue-100">
                                <div className="absolute inset-0 rounded-full border-8 border-primary border-t-transparent border-l-transparent rotate-45"></div>
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl font-black text-gray-900">88%</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-500">Present</span>
                                </div>
                             </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-primary"></span>
                                    <span className="text-gray-500">On Time</span>
                                </div>
                                <span className="font-bold text-gray-900">142</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-white"></span>
                                    <span className="text-gray-500">Late/Absent</span>
                                </div>
                                <span className="font-bold text-gray-900">18</span>
                            </div>
                        </div>
                    </div>

                    {/* Latest Notices Feed */}
                    <div className="bg-white p-8 rounded-xl editorial-shadow">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-headline text-lg font-bold text-gray-900">Latest Notices</h3>
                            <button className="text-gray-500 p-1 hover:bg-gray-100 rounded-full transition-all">
                                <span className="material-symbols-outlined">more_horiz</span>
                            </button>
                        </div>
                        <div className="space-y-6">
                            {latestNotices.map((notice) => (
                                <div key={notice._id} className={`relative pl-6 border-l-2 ${notice.urgent ? "border-primary" : "border-gray-300"}`}>
                                    {notice.urgent && <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-primary"></div>}
                                    <h4 className="text-sm font-bold text-gray-900 leading-tight">{notice.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{notice.desc}</p>
                                    <span className="text-[10px] font-semibold text-gray-500 uppercase mt-2 block">{notice.time}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => navigate('/teacher/notices')} className="w-full mt-8 py-3 bg-gray-100 hover:bg-gray-200 transition-colors text-gray-900 font-semibold rounded-xl text-sm">
                            View All Notices
                        </button>
                    </div>

                </div>
            </div>

            {/* Mobile Nav Fix: Add padding bottom handled by parent layout usually, but ensures safe area */}
            <div className="h-16 md:hidden"></div>
            </main>
        </div>
    );
};

export default TeacherDashboard;
