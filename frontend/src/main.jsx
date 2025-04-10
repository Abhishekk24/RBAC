import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { AppKitProvider } from "./AppKitProvider";
import App from "./App";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkKey}>
      <AppKitProvider>
        <App />
      </AppKitProvider>
    </ClerkProvider>
  </StrictMode>
);
