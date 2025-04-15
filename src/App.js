import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import Dashboard from "./Dashboard";
import PatientManagement from './components/PatientManagement';
import Inventory from './components/Inventory/InventoryMain';
import Billing from './components/Billing/BillingMain';
import Reports from './pages/Reports';
import AdminStaffDashboard from './components/AdminStaffDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import Unauthorized from './pages/Unauthorized';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const { currentUser, role, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // avoid premature redirects

  return (
    <Router>
      <div className="App">
        <nav className="tab-nav">
          {!currentUser && (
            <>
              <Link to="/login">Login</Link> | 
              <Link to="/signup">Sign Up</Link>
            </>
          )}
          {currentUser && (
            <>
              <Link to="/dashboard">Dashboard</Link> | 
              <Link to="/inventory">Inventory</Link> | 
              <Link to="/billing">Billing</Link> |
              <Link to="/reports">Reports</Link>
              {role === 'admin' && <> | <Link to="/admin-staff-dashboard">Admin Tools</Link></>}
            </>
          )}
        </nav>

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Admin-only route */}
          <Route path="/admin-staff-dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminStaffDashboard />
            </ProtectedRoute>
          } />

          {/* Admin + Staff shared routes */}
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
