import React from "react";
import { Link } from "react-router-dom";
import { Shield, Cpu, Users, Key, Box, Coins, Lock } from "lucide-react";

const Sidebar = ({ role }) => (
  <aside className="w-64 bg-gray-100 h-screen p-4">
    <nav className="space-y-2">
      <Link to="/" className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded">
        <Shield className="w-5 h-5" />
        <span>Home</span>
      </Link>
      {role === "sensor_client" && (
        <Link to="/user" className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded">
          <Cpu className="w-5 h-5" />
          <span>User</span>
        </Link>
      )}
      {role === "admin" && (
        <Link to="/admin" className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded">
          <Users className="w-5 h-5" />
          <span>Admin</span>
        </Link>
      )}
      <Link to="/check" className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded">
        <Key className="w-5 h-5" />
        <span>Check Access</span>
      </Link>
      <Link to="/tokens" className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded">
        <Coins className="w-5 h-5" />
        <span>Tokens</span>
      </Link>
      <Link to="/access-control" className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded">
        <Lock className="w-5 h-5" />
        <span>Access Control</span>
      </Link>
      <Link to="/transactions" className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded">
        <Box className="w-5 h-5" />
        <span>Transactions</span>
      </Link>
    </nav>
  </aside>
);

export default Sidebar;
