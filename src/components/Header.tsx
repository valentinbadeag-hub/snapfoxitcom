import { Button } from "@/components/ui/button";
import { Heart, LogIn, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          >
            <span className="text-2xl">🦊</span>
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              SnapFox
            </span>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/favorites')}
                  className="gap-2"
                >
                  <Heart className="w-4 h-4" />
                  <span className="hidden sm:inline">Favorites</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Log Out</span>
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/auth')}
                className="gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Login / Sign Up</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;