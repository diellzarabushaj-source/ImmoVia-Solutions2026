import { useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";

export default function Login() {
  const { isSignedIn, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      setLocation("/dashboard");
    } else {
      window.location.href = `${basePath}/sign-in`;
    }
  }, [isLoaded, isSignedIn]);

  return null;
}
