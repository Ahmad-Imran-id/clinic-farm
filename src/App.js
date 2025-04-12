import React from "react";
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
import Unauthorized from './pages/Unauthorized'; // ✅ optional page for forbidden access
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
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
