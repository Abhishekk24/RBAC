import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import Navbar from "./Components/Navbar";
import Home from "./Pages/Home";
import UserRequestAccess from "./Pages/UserRequestAccess";
import AdminPanel from "./Pages/AdminPanel";
import CheckAccess from "./Pages/CheckAccess";
import AuthHandler from "./Authhandler";

function App() {
  const [role, setRole] = useState(null);
  return (
    <Router>
      <SignedIn>
        <AuthHandler onRoleAssigned={setRole} />
        <Navbar role={role} />
        <Routes>
          <Route path="/" element={<Home />} />
          {role === "sensor_client" && (
            <Route path="/user" element={<UserRequestAccess />} />
          )}
          {role === "admin" && <Route path="/admin" element={<AdminPanel />} />}
          <Route path="/check" element={<CheckAccess />} />
        </Routes>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </Router>
  );
}

export default App;
