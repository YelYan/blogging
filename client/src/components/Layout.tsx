import Header from "./Header";
import Footer from "./Footer";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { loadUser } from "@/store/slices/authSlice";
import { Outlet } from "react-router-dom";

export default function Layout() {
  const { loading, token, user } = useAuth();

  useEffect(() => {
    if (token && !user) {
      loadUser();
    }
  }, [token, user, loadUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
