import React from "react";
import { Link } from "react-router-dom";
import { SignOutButton } from "@clerk/clerk-react";

const Navbar = ({ role }) => {
  return (
    <nav>
      <Link to="/">Home</Link>
      {role === "sensor_client" && <Link to="/user">User</Link>}
      {role === "admin" && <Link to="/admin">Admin</Link>}
      <Link to="/check">Check Access</Link>
      <SignOutButton />
    </nav>
  );
};

export default Navbar;