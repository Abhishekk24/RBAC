import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import Navbar from "./Components/Navbar";
import Sidebar from "./Components/Sidebar";
import Home from "./Pages/Home";
import UserRequestAccess from "./Pages/UserRequestAccess";
import AdminPanel from "./Pages/AdminPanel";
import CheckAccess from "./Pages/CheckAccess";
import AuthHandler from "./Authhandler";
import TokensPage from "./Pages/TokensPage";
import "./index.css";

function App() {
  const [role, setRole] = useState(null);

  return (
    <Router>
      <SignedIn>
        <AuthHandler onRoleAssigned={setRole} />
        <div className="flex">
          <Sidebar role={role} />
          <div className="flex-1">
            {/* <Navbar role={role} /> */}
            <Routes>
              <Route path="/" element={<Home />} />
              {role === "sensor_client" && (
                <Route path="/user" element={<UserRequestAccess />} />
              )}
              {role === "sensor_client" && (
                <Route path="/tokens" element={<TokensPage />} />
              )}
              {role === "admin" && (
                <Route path="/admin" element={<AdminPanel />} />
              )}
              <Route path="/check" element={<CheckAccess />} />
            </Routes>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </Router>
  );
}

export default App;
