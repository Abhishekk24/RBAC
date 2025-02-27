import React from "react";
import { ShieldCheck, Cpu, Users, Key, Server, Lock, ListChecks } from "lucide-react";

const Home = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4 flex items-center">
        <ShieldCheck className="w-6 h-6 mr-2" /> BlendCAC: Blockchain-Based Access Control
      </h1>
      <p className="mb-4 text-lg">
        BlendCAC is a decentralized access control system designed for IoT devices using blockchain technology.
      </p>
      
      <h2 className="text-2xl font-semibold mt-6 flex items-center">
        <Cpu className="w-5 h-5 mr-2" /> High-Level Architecture Components
      </h2>
      <ul className="list-disc list-inside space-y-2 mt-2 text-lg">
        <li className="flex items-center"><Cpu className="w-5 h-5 mr-2" /> <strong>IoT Devices:</strong> Resource-constrained nodes like sensors, smart appliances, and Raspberry Pi devices.</li>
        <li className="flex items-center"><Server className="w-5 h-5 mr-2" /> <strong>Blockchain Network:</strong> A decentralized backend managing access control policies and capability tokens.</li>
        <li className="flex items-center"><Key className="w-5 h-5 mr-2" /> <strong>Smart Contracts:</strong> Implements capability token issuance, propagation, delegation, and revocation.</li>
        <li className="flex items-center"><Users className="w-5 h-5 mr-2" /> <strong>Capability Token Manager:</strong> Generates and validates tokens, ensuring they are assigned to authorized users/devices.</li>
        <li className="flex items-center"><Lock className="w-5 h-5 mr-2" /> <strong>Access Control Gateway:</strong> Verifies tokens and grants/denies access between IoT devices and blockchain.</li>
        <li className="flex items-center"><ListChecks className="w-5 h-5 mr-2" /> <strong>User/Device Management Interface:</strong> Allows registration, policy management, and monitoring logs.</li>
      </ul>
      
      <h2 className="text-2xl font-semibold mt-6 flex items-center">
        <ListChecks className="w-5 h-5 mr-2" /> Flow Diagram (Text-based Description)
      </h2>
      <ol className="list-decimal list-inside space-y-2 mt-2 text-lg">
        <li className="flex items-center"><ShieldCheck className="w-5 h-5 mr-2" /> Device Registration: IoT devices register on the blockchain via a smart contract and receive a unique identity.</li>
        <li className="flex items-center"><Key className="w-5 h-5 mr-2" /> Token Issuance: Users request capability tokens from the smart contract for specific devices/services.</li>
        <li className="flex items-center"><Lock className="w-5 h-5 mr-2" /> Token Validation & Access: The Access Control Gateway validates tokens and grants access if valid.</li>
        <li className="flex items-center"><Users className="w-5 h-5 mr-2" /> Revocation & Delegation: Tokens can be delegated to other devices or revoked via smart contract updates.</li>
      </ol>
    </div>
  );
};

export default Home;