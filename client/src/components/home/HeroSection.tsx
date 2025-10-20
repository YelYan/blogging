import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, PenSquare, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const HeroSection = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                Share Your Stories with the
                <span className="text-primary"> World</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Join our community of writers and readers. Discover amazing
                stories, share your thoughts, and connect with like-minded
                people.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {isAuthenticated ? (
                <Link to="/create-story">
                  <Button size="lg" className="w-full sm:w-auto">
                    <PenSquare className="mr-2 h-5 w-5" />
                    Write a Story
                  </Button>
                </Link>
              ) : (
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Link to="/stories">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  Browse Stories
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-8 pt-8 border-t">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">10k+</p>
                  <p className="text-sm text-muted-foreground">
                    Active Writers
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">50k+</p>
                  <p className="text-sm text-muted-foreground">
                    Stories Published
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative lg:block hidden">
            <div className="relative z-10">
              <img
                src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800"
                alt="Writing"
                className="rounded-2xl shadow-2xl"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl" />
            <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -top-6 -left-6 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
