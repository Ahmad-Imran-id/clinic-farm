import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import Dashboard from "./Dashboard";
import PatientManagement from './components/PatientManagement';
import Inventory from './components/Inventory/InventoryMain';
import Billing from './components/Billing/BillingMain';
import Reports from './pages/Reports';
import AdminStaffDashboard from './components/AdminStaffDashboard'; // ✅ Add this when created
import ProtectedRoute from './components/ProtectedRoute'; // ✅ custom wrapper
// ✅ optional page for forbidden access
import { useAuth } from './hooks/useAuth'; // Import useAuth hook for authentication state
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const { currentUser, role } = useAuth(); // Using useAuth to get current user and role

  useEffect(() => {
    if (!currentUser) {
      // If the user is not logged in, redirect them to login
      window.location.href = "/login";
    }
  }, [currentUser]);

  return (
    <Router>
      <div className="App">
        <nav className="tab-nav">
          <Link to="/login">Login</Link> | 
          <Link to="/signup">Sign Up</Link> | 
          <Link to="/dashboard">Dashboard</Link> | 
          <Link to="/inventory">Inventory</Link> | 
          <Link to="/billing">Billing</Link> |
          <Link to="/reports">Reports</Link>
        </nav>

        <Routes>

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Unauthorized Fallback */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Admin-only routes */}
          <Route path="/admin-staff-dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminStaffDashboard />
            </ProtectedRoute>
          } />

          {/* Shared routes for Admin & Staff */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/inventory" element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <Inventory />
            </ProtectedRoute>
          } />

          <Route path="/billing" element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <Billing />
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <Reports />
            </ProtectedRoute>
          } />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
