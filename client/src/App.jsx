import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Login from './pages/Login.jsx';
import PlantDetails from './pages/PlantDetails.jsx';
import { useAuth } from './context/AuthContext.jsx';

function ProtectedRoute({ children, role }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-cream text-leaf-900 transition-colors dark:bg-[#07130a] dark:text-leaf-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/plants/:id" element={<PlantDetails />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Footer />
    </div>
  );
}
