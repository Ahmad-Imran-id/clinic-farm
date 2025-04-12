import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import Dashboard from "./Dashboard";
import PatientManagement from './components/PatientManagement';
import Inventory from "./pages/Inventory";
import Billing from './pages/Billing'; // Import Billing page
import Reports from './Reports'; // Import the new file


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
          <Link to="/reports">Reports</Link> {/* New tab */}
        </nav>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/billing" element={<Billing />} /> {/* Add Billing route */}
          <Route path="/reports" element={<Reports />} /> {/* New route */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
