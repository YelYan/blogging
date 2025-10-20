import { useState } from "react";
import { Link } from "react-router-dom";
import { Story } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface FeaturedStoriesProps {
  stories: Story[];
}

export default function FeaturedStories({ stories }: FeaturedStoriesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % stories.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  const currentStory = stories[currentIndex];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          <h2 className="text-2xl font-bold">Featured Stories</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            disabled={stories.length <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            disabled={stories.length <= 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative h-64 md:h-96">
            <img
              src={
                currentStory.image ||
                "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800"
              }
              alt={currentStory.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <Badge className="absolute top-4 left-4">Featured</Badge>
          </div>
          <CardContent className="p-8 flex flex-col justify-center">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {currentStory.readtime} min read
                <span>•</span>
                {format(new Date(currentStory.createdAt), "MMM dd, yyyy")}
              </div>
              <Link to={`/story/${currentStory.slug}`}>
                <h3 className="text-2xl font-bold hover:text-primary transition-colors">
                  {currentStory.title}
                </h3>
              </Link>
              <p className="text-muted-foreground line-clamp-3">
                {currentStory.excerpt || currentStory.content.substring(0, 150)}
                ...
              </p>
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={currentStory.author.photo} />
                    <AvatarFallback>
                      {currentStory.author.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {currentStory.author.username}
                    </p>
                    <p className="text-sm text-muted-foreground">Author</p>
                  </div>
                </div>
                <Link to={`/story/${currentStory.slug}`}>
                  <Button>Read More</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Indicators */}
      <div className="flex justify-center gap-2">
        {stories.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 w-2 rounded-full transition-all ${
              index === currentIndex
                ? "bg-primary w-8"
                : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
