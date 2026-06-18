import axios from "axios";
import { getAuthToken } from "../utils/authSession";
import API_BASE from "../utils/apiConfig";

const API = axios.create({
  baseURL: API_BASE,
});

API.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const marksAPI = {
  batchSave: (data) => API.post("/marks", data),
  getMarks: (params) => API.get("/marks", { params }),
  getMyMarks: () => API.get("/marks/student/me"),
  getStudentMarks: (studentId) => API.get(`/marks/student/${studentId}`),
  getClassMarks: (classId, params) => API.get(`/marks/class/${classId}`, { params }),
  updateMarks: (markId, data) => API.patch(`/marks/${markId}`, data),
  deleteMarks: (markId) => API.delete(`/marks/${markId}`),
  getExamTypes: () => API.get("/marks/examTypes"),
  getPolicy: () => API.get("/marks/policy"),
  updatePolicy: (data) => API.patch("/marks/policy", data),
  getSubjectMarks: (subjectName) => API.get(`/marks/subject/${subjectName}`),
  getExamConfig: (classId, subjectId) => API.get("/marks/exam-config", { params: { classId, subjectId } }),
  saveExamConfig: (classId, subjectId, configs) => API.put("/marks/exam-config", { classId, subjectId, configs }),
  entryMarks: (data) => API.post("/marks/entry", data),
  publishExam: (classId, subjectId, examType) => API.post("/marks/publish-exam", { classId, subjectId, examType }),
  getAssessmentMatrix: (classId, subjectId) => API.get("/marks/assessment-matrix", { params: { classId, subjectId } }),
};

export default API;
