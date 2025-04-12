import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import Dashboard from "./Dashboard";
import PatientManagement from './components/PatientManagement';
import Inventory from './components/Inventory/InventoryMain';  // ✅ updated path
import Billing from './pages/Billing/BillingMain';             // ✅ updated path
import Reports from './Reports';
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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />  {/* ✅ InventoryMain.js */}
          <Route path="/billing" element={<Billing />} />      {/* ✅ BillingMain.js */}
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
