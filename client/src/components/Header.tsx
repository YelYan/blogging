import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Home,
  PenSquare,
  User,
  LogOut,
  LogIn,
  BookOpen,
  Settings,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "./ModeToggle";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Stories", href: "/stories", icon: BookOpen },
  ];

  const authNavItems = [
    { label: "Write", href: "/create-story", icon: PenSquare },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6" />
              <span className="font-bold text-xl hidden sm:inline-block">
                BlogHub
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
              {isAuthenticated &&
                authNavItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="text-sm font-medium transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
            </nav>
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-sm mx-6"
          >
            <div className="relative w-full">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search stories..."
                className="pl-8 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <ModeToggle />

            {isAuthenticated ? (
              <>
                {/* Desktop User Menu */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-9 w-9 rounded-full"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user?.photo} alt={user?.username} />
                          <AvatarFallback>
                            {user?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56"
                      align="end"
                      forceMount
                    >
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user?.username}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user?.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/profile")}>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        My Stories
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/settings")}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Write Button - Desktop */}
                <Link to="/create-story" className="hidden md:block">
                  <Button size="sm">
                    <PenSquare className="mr-2 h-4 w-4" />
                    Write
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {/* Auth Buttons - Desktop */}
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </div>
              </>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <MobileNav
                  isAuthenticated={isAuthenticated}
                  user={user}
                  onClose={() => setIsMenuOpen(false)}
                  onLogout={handleLogout}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

// Mobile Navigation Component
function MobileNav({
  isAuthenticated,
  user,
  onClose,
  onLogout,
}: {
  isAuthenticated: boolean;
  user: any;
  onClose: () => void;
  onLogout: () => void;
}) {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* User Info */}
      {isAuthenticated && user && (
        <div className="flex items-center gap-3 pb-4 mb-4 border-b">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.photo} alt={user.username} />
            <AvatarFallback>
              {user.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.username}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      )}

      {/* Search - Mobile */}
      <div className="mb-4">
        <Input
          type="search"
          placeholder="Search stories..."
          className="w-full"
        />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => handleNavigation("/")}
        >
          <Home className="mr-2 h-4 w-4" />
          Home
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => handleNavigation("/stories")}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Stories
        </Button>

        {isAuthenticated ? (
          <>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleNavigation("/create-story")}
            >
              <PenSquare className="mr-2 h-4 w-4" />
              Write Story
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleNavigation("/profile")}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleNavigation("/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <div className="pt-4 mt-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-600"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="pt-4 mt-4 border-t space-y-2">
              <Button
                className="w-full"
                onClick={() => handleNavigation("/login")}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleNavigation("/register")}
              >
                Get Started
              </Button>
            </div>
          </>
        )}
      </nav>
    </div>
  );
}
