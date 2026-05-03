import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import PatientUploadPage from './pages/PatientUploadPage';
import ResultPage from './pages/ResultPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import PatientManagement from './pages/PatientManagement';
import AuthCallback from './pages/AuthCallback';
import CompleteProfilePage from './pages/CompleteProfilePage';
import AppointmentsPage from './pages/AppointmentsPage';
import PatientAppointmentsPage from './pages/PatientAppointmentsPage';
import PendingAnalyzePage from './pages/PendingAnalyzePage';
import PatientNotificationsPage from './pages/PatientNotificationsPage';
import PatientFeedbackDetailPage from './pages/PatientFeedbackDetailPage';

function App() {
  return (
    <div className="min-h-screen bg-background-light">
      <Router>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/patient/upload" element={<PatientUploadPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/complete-profile" element={<CompleteProfilePage />} />
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/patients" element={<PatientManagement />} />
          <Route path="/patient-management" element={<PatientManagement />} />
          <Route path="/doctor/appointments" element={<AppointmentsPage />} />
          <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
          <Route path="/patient/notifications" element={<PatientNotificationsPage />} />
          <Route path="/patient/feedback-detail" element={<PatientFeedbackDetailPage />} />
          <Route path="/doctor/analyze-pending" element={<PendingAnalyzePage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

