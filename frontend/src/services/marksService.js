import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const marksAPI = {
  // Add marks
  addMarks: (marksData) => API.post("/marks", marksData),

  // Get student marks
  getStudentMarks: (studentId) => API.get(`/marks/student/${studentId}`),

  // Get class marks
  getClassMarks: (classId) => API.get(`/marks/class/${classId}`),

  // Get subject marks
  getSubjectMarks: (filters) =>
    API.get("/marks/subject/marks", { params: filters }),

  // Update marks
  updateMarks: (markId, marksData) => API.put(`/marks/${markId}`, marksData),

  // Delete marks
  deleteMarks: (markId) => API.delete(`/marks/${markId}`),
};

export default API;
