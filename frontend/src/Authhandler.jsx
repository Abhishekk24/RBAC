import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthHandler = ({ onRoleAssigned }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;

      const userRef = doc(db, "users", user.id);
      const sensorClientRef = doc(db, "sensor_clients", user.id);

      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          onRoleAssigned("admin");
          setLoading(false);
          return;
        }

        const sensorSnap = await getDoc(sensorClientRef);
        if (sensorSnap.exists()) {
          onRoleAssigned("sensor_client");
          setLoading(false);
          return;
        }

        await setDoc(sensorClientRef, {
          clerk_user_id: user.id,
          email: user.primaryEmailAddress.emailAddress,
          first_name: user.firstName,
          last_name: user.lastName,
        });

        onRoleAssigned("sensor_client");
      } catch (error) {
        console.error("Error checking user role:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user]);

  if (loading) return <p>Loading...</p>;

  return null;
};

export default AuthHandler;
