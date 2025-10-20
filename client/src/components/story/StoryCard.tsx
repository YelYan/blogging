import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Heart,
  MessageCircle,
  Clock,
  Eye,
  Bookmark,
  Share2,
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp,
  Star,
  BarChart3,
} from "lucide-react";
import type { Story } from "@/types";
import { format, formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { storyApi } from "@/services/story.api";
import { useAuth } from "@/hooks/useAuth";

import { cn } from "@/lib/utils";
import { useState } from "react";
import toast from "react-hot-toast";

interface StoryCardProps {
  story: Story;
  variant?:
    | "default"
    | "compact"
    | "featured"
    | "list"
    | "grid"
    | "minimal"
    | "detailed";
  showAuthor?: boolean;
  showActions?: boolean;
  showStats?: boolean;
  className?: string;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function StoryCard({
  story,
  variant = "default",
  showAuthor = true,
  showActions = true,
  showStats = true,
  className,
  onDelete,
  onEdit,
}: StoryCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [imageError, setImageError] = useState(false);
  const author = typeof story.author === "object" ? story.author : null;
  const isOwner = user?.id === author?._id;

  // Mutations
  const likeMutation = useMutation({
    mutationFn: () => storyApi.likeStory(story._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      //   toast({
      //     title: story.isLiked ? "Removed like" : "Story liked!",
      //     duration: 2000,
      //   });
      toast.success(story.isLiked ? "Removed like" : "Story liked!");
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => storyApi.bookmarkStory(story._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success(
        story.isBookmarked ? "Removed from bookmarks" : "Added to bookmarks!"
      );
    },
  });

  const shareMutation = useMutation({
    mutationFn: () => storyApi.shareStory(story._id),
    onSuccess: () => {
      navigator.clipboard.writeText(
        `${window.location.origin}/story/${story.slug}`
      );
      toast.success("Link copied to clipboard!");
    },
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: story.title,
          text: story.excerpt || story.content.substring(0, 100),
          url: `${window.location.origin}/story/${story.slug}`,
        });
        shareMutation.mutate();
      } catch (err) {
        // User cancelled share
      }
    } else {
      shareMutation.mutate();
    }
  };

  // Format engagement score
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Calculate engagement rate
  const engagementRate =
    story.views > 0
      ? (((story.likeCount + story.commentCount) / story.views) * 100).toFixed(
          1
        )
      : "0";

  // Minimal Card Variant
  if (variant === "minimal") {
    return (
      <Card
        className={cn("hover:shadow-md transition-all duration-200", className)}
      >
        <CardContent className="p-4">
          <Link to={`/story/${story.slug}`} className="space-y-2">
            <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
              {story.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{format(new Date(story.createdAt), "MMM dd")}</span>
              <span>•</span>
              <span>{story.readtime} min read</span>
              {story.featured && (
                <>
                  <span>•</span>
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                </>
              )}
            </div>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Compact Card Variant
  if (variant === "compact") {
    return (
      <Card
        className={cn("hover:shadow-md transition-all duration-200", className)}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Link to={`/story/${story.slug}`} className="shrink-0">
              <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
                {!imageError ? (
                  <img
                    src={story.image || "/placeholder.jpg"}
                    alt={story.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                {story.featured && (
                  <div className="absolute top-1 right-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  </div>
                )}
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <Link to={`/story/${story.slug}`}>
                <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors mb-1">
                  {story.title}
                </h3>
              </Link>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {story.excerpt || story.content.substring(0, 100)}...
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {story.readtime}m
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {formatNumber(story.views)}
                  </span>
                </div>
                {showActions && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.preventDefault();
                      if (user) bookmarkMutation.mutate();
                    }}
                  >
                    <Bookmark
                      className={cn(
                        "h-3.5 w-3.5",
                        story.isBookmarked && "fill-current"
                      )}
                    />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // List Card Variant
  if (variant === "list") {
    return (
      <Card
        className={cn("hover:shadow-md transition-all duration-200", className)}
      >
        <CardContent className="p-6">
          <div className="flex gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Link to={`/story/${story.slug}`}>
                    <h2 className="text-xl font-bold hover:text-primary transition-colors">
                      {story.title}
                    </h2>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{story.category}</Badge>
                    {story.featured && (
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Featured
                      </Badge>
                    )}
                    {story.isPinned && (
                      <Badge variant="default">📌 Pinned</Badge>
                    )}
                  </div>
                </div>

                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit?.(story._id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete?.(story._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <p className="text-muted-foreground line-clamp-2">
                {story.excerpt || story.content.substring(0, 200)}...
              </p>

              {showAuthor && author && (
                <div className="flex items-center gap-3">
                  <Link
                    to={`/profile/${author._id}`}
                    className="flex items-center gap-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={author.photo} />
                      <AvatarFallback>{author.username[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hover:text-primary">
                      {author.username}
                    </span>
                  </Link>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(story.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1">
                  {story.tags?.slice(0, 3).map((tag) => (
                    <Link key={tag} to={`/tag/${tag}`}>
                      <Badge variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    </Link>
                  ))}
                </div>

                {showActions && (
                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={(e) => {
                              e.preventDefault();
                              if (user) likeMutation.mutate();
                            }}
                          >
                            <Heart
                              className={cn(
                                "h-4 w-4 mr-1",
                                story.isLiked && "fill-current text-red-500"
                              )}
                            />
                            {formatNumber(story.likeCount)}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{story.isLiked ? "Unlike" : "Like"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {formatNumber(story.commentCount)}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={(e) => {
                        e.preventDefault();
                        handleShare();
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.preventDefault();
                        if (user) bookmarkMutation.mutate();
                      }}
                    >
                      <Bookmark
                        className={cn(
                          "h-4 w-4",
                          story.isBookmarked && "fill-current"
                        )}
                      />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Link
              to={`/story/${story.slug}`}
              className="shrink-0 hidden md:block"
            >
              <div className="relative w-48 h-32 rounded-lg overflow-hidden bg-muted">
                {!imageError ? (
                  <img
                    src={story.image || "/placeholder.jpg"}
                    alt={story.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Featured Card Variant
  if (variant === "featured") {
    return (
      <Card
        className={cn(
          "overflow-hidden hover:shadow-xl transition-all duration-300 group",
          className
        )}
      >
        <div className="relative h-64 md:h-80 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
          {!imageError ? (
            <img
              src={story.image || "/placeholder.jpg"}
              alt={story.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className="bg-primary/90 backdrop-blur-sm">
              {story.category}
            </Badge>
            {story.featured && (
              <Badge className="bg-yellow-500/90 backdrop-blur-sm gap-1">
                <Star className="h-3 w-3 fill-current" />
                Featured
              </Badge>
            )}
          </div>

          {showStats && (
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-white" />
              <span className="text-xs text-white font-medium">
                {engagementRate}% engagement
              </span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <Link to={`/story/${story.slug}`}>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 hover:text-primary-200 transition-colors">
                {story.title}
              </h2>
            </Link>

            <p className="text-white/90 line-clamp-2 mb-4">
              {story.excerpt || story.content.substring(0, 150)}...
            </p>

            <div className="flex items-center justify-between">
              {showAuthor && author && (
                <Link
                  to={`/profile/${author._id}`}
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-10 w-10 border-2 border-white/20">
                    <AvatarImage src={author.photo} />
                    <AvatarFallback>{author.username[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-medium">{author.username}</p>
                    <p className="text-white/70 text-xs">
                      {format(new Date(story.createdAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                </Link>
              )}

              <div className="flex items-center gap-3 text-white/90 text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {story.readtime}m
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {formatNumber(story.views)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {showActions && (
          <CardFooter className="p-4 bg-muted/30">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    if (user) likeMutation.mutate();
                  }}
                >
                  <Heart
                    className={cn(
                      "h-4 w-4 mr-1",
                      story.isLiked && "fill-current text-red-500"
                    )}
                  />
                  {formatNumber(story.likeCount)}
                </Button>

                <Button variant="ghost" size="sm">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {formatNumber(story.commentCount)}
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    handleShare();
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    if (user) bookmarkMutation.mutate();
                  }}
                >
                  <Bookmark
                    className={cn(
                      "h-4 w-4",
                      story.isBookmarked && "fill-current"
                    )}
                  />
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    );
  }

  // Detailed Card Variant
  if (variant === "detailed") {
    return (
      <Card
        className={cn(
          "overflow-hidden hover:shadow-lg transition-all duration-200",
          className
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{story.category}</Badge>
              {story.featured && (
                <Badge variant="default" className="gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Featured
                </Badge>
              )}
              {story.status === "draft" && (
                <Badge variant="outline">Draft</Badge>
              )}
            </div>

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(story._id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Stats
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete?.(story._id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <Link to={`/story/${story.slug}`}>
          <div className="relative h-48 overflow-hidden bg-muted">
            {!imageError ? (
              <img
                src={story.image || "/placeholder.jpg"}
                alt={story.title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </Link>

        <CardContent className="pt-4">
          <Link to={`/story/${story.slug}`}>
            <h2 className="text-xl font-bold mb-2 hover:text-primary transition-colors">
              {story.title}
            </h2>
          </Link>

          <p className="text-muted-foreground line-clamp-3 mb-4">
            {story.excerpt || story.content.substring(0, 200)}...
          </p>

          {story.tags && story.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {story.tags.slice(0, 5).map((tag) => (
                <Link key={tag} to={`/tag/${tag}`}>
                  <Badge variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {/* Stats Grid */}
          {showStats && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Views</p>
                  <p className="font-semibold">{formatNumber(story.views)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Likes</p>
                  <p className="font-semibold">
                    {formatNumber(story.likeCount)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Comments</p>
                  <p className="font-semibold">
                    {formatNumber(story.commentCount)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Engagement</p>
                  <p className="font-semibold">{engagementRate}%</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex items-center justify-between w-full">
            {showAuthor && author && (
              <Link
                to={`/profile/${author._id}`}
                className="flex items-center gap-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={author.photo} />
                  <AvatarFallback>{author.username[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{author.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(story.createdAt), "MMM dd")}
                  </p>
                </div>
              </Link>
            )}

            {showActions && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    if (user) likeMutation.mutate();
                  }}
                >
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      story.isLiked && "fill-current text-red-500"
                    )}
                  />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    handleShare();
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    if (user) bookmarkMutation.mutate();
                  }}
                >
                  <Bookmark
                    className={cn(
                      "h-4 w-4",
                      story.isBookmarked && "fill-current"
                    )}
                  />
                </Button>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  }

  // Default Card Variant (Grid)
  return (
    <Card
      className={cn(
        "h-full overflow-hidden hover:shadow-lg transition-all duration-200 group",
        className
      )}
    >
      <CardHeader className="p-0">
        <Link to={`/story/${story.slug}`}>
          <div className="relative overflow-hidden h-48 bg-muted">
            {!imageError ? (
              <img
                src={story.image || "/placeholder.jpg"}
                alt={story.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground" />
              </div>
            )}

            {/* Overlay badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge
                variant="secondary"
                className="backdrop-blur-sm bg-secondary/90"
              >
                {story.category}
              </Badge>
              {story.featured && (
                <Badge
                  variant="default"
                  className="backdrop-blur-sm bg-primary/90"
                >
                  <Star className="h-3 w-3 fill-current mr-1" />
                  Featured
                </Badge>
              )}
            </div>

            {/* Read time badge */}
            <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="text-xs">{story.readtime} min</span>
            </div>
          </div>
        </Link>
      </CardHeader>

      <CardContent className="p-6">
        <Link to={`/story/${story.slug}`}>
          <h2 className="text-xl font-bold mb-2 line-clamp-2 hover:text-primary transition-colors">
            {story.title}
          </h2>
        </Link>

        <p className="text-muted-foreground line-clamp-3 mb-4">
          {story.excerpt || story.content.substring(0, 150)}...
        </p>

        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {story.tags.slice(0, 3).map((tag) => (
              <Link key={tag} to={`/tag/${tag}`}>
                <Badge
                  variant="outline"
                  className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  #{tag}
                </Badge>
              </Link>
            ))}
            {story.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{story.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="px-6 pb-6 pt-0">
        <div className="flex items-center justify-between w-full">
          {showAuthor && author && (
            <Link
              to={`/profile/${author._id}`}
              className="flex items-center space-x-2 group/author"
            >
              <Avatar className="h-8 w-8 transition-transform group-hover/author:scale-110">
                <AvatarImage src={author.photo} />
                <AvatarFallback>
                  {author.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium group-hover/author:text-primary transition-colors">
                  {author.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(story.createdAt), "MMM dd, yyyy")}
                </p>
              </div>
            </Link>
          )}

          {showActions && (
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={(e) => {
                        e.preventDefault();
                        if (user) likeMutation.mutate();
                      }}
                      disabled={!user}
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4 mr-1 transition-colors",
                          story.isLiked && "fill-current text-red-500"
                        )}
                      />
                      {formatNumber(story.likeCount)}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{story.isLiked ? "Unlike" : "Like"}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {formatNumber(story.commentCount)}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Comments</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.preventDefault();
                        if (user) bookmarkMutation.mutate();
                      }}
                      disabled={!user}
                    >
                      <Bookmark
                        className={cn(
                          "h-4 w-4 transition-colors",
                          story.isBookmarked && "fill-current"
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{story.isBookmarked ? "Remove bookmark" : "Bookmark"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

// Loading Skeleton
export function StoryCardSkeleton({
  variant = "default",
}: {
  variant?: StoryCardProps["variant"];
}) {
  if (variant === "minimal") {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Skeleton className="w-24 h-24 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-5 mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "list") {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-6">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="w-48 h-32 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-0">
        <Skeleton className="h-48 rounded-t-lg" />
      </CardHeader>
      <CardContent className="p-6">
        <Skeleton className="h-6 mb-2" />
        <Skeleton className="h-4 mb-1" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardContent>
      <CardFooter className="px-6 pb-6 pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div>
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
