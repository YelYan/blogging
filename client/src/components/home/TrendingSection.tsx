import { Link } from "react-router-dom";
import type { Story } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TrendingSectionProps {
  stories: Story[];
}

export default function TrendingSection({ stories }: TrendingSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <TrendingUp className="mr-2 h-4 w-4" />
          Trending This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stories.slice(0, 5).map((story, index) => (
            <Link
              key={story._id}
              to={`/story/${story.slug}`}
              className="flex gap-3 group"
            >
              <span className="text-2xl font-bold text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 space-y-1">
                <h4 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                  {story.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={story.author.photo} />
                      <AvatarFallback>
                        {story.author.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{story.author.username}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    <span>{story.likeCount}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
