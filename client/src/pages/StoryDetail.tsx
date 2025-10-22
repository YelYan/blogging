// pages/StoryDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store/store";
import { addBookmark, removeBookmark } from "@/store/slices/authSlice";
import { storyApi } from "@/services/story.api";
import { commentApi } from "@/services/comment.api";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  ChevronLeft,
  Clock,
  Calendar,
  Hash,
  TrendingUp,
  Pin,
  Flag,
  Copy,
  Twitter,
  Facebook,
  Linkedin,
  Link2,
  ThumbsUp,
  Send,
} from "lucide-react";

// Shadcn/ui components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Types
interface Author {
  _id: string;
  username: string;
  avatar?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
}

interface Story {
  _id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  author: Author;
  image?: string;
  images?: string[];
  category: string;
  tags: string[];
  featured: boolean;
  published: boolean;
  publishedAt: string;
  readtime: number;
  likes: string[];
  likeCount: number;
  dislikes: string[];
  dislikeCount: number;
  comments: Comment[];
  commentCount: number;
  views: number;
  bookmarkedBy: string[];
  bookmarkCount: number;
  shares: number;
  status: string;
  allowComments: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  lastEditedAt?: string;
  isLikedByUser?: boolean;
  isDislikedByUser?: boolean;
  isBookmarkedByUser?: boolean;
  engagementScore?: number;
}

interface Comment {
  _id: string;
  author: Author;
  content: string;
  likes: string[];
  replies?: Comment[];
  createdAt: string;
}

interface StoryStats {
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  bookmarks: number;
  shares: number;
  engagementScore: number;
}

const StoryDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  // State
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [commentText, setCommentText] = useState("");
  //   const [replyingTo, setReplyingTo] = useState<string | null>(null);
  //   const [replyText, setReplyText] = useState("");
  const [readProgress, setReadProgress] = useState(0);

  // Fetch story data
  const {
    data: storyData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["story", slug],
    queryFn: () => storyApi.getStory(slug!),
    enabled: !!slug,
  });

  const story: Story = storyData?.data;
  const relatedStories: Story[] = storyData?.relatedStories || [];

  // Fetch story statistics
  const { data: statsData } = useQuery<{ data: StoryStats }>({
    queryKey: ["story-stats", story?._id],
    queryFn: () => storyApi.getStoryStats(story._id),
    enabled: !!story?._id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const stats = statsData?.data;

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setReadProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mutations
  const likeMutation = useMutation({
    mutationFn: () => storyApi.likeStory(story._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["story", slug] });
      queryClient.invalidateQueries({ queryKey: ["story-stats", story._id] });
      toast.success("Story liked!");
    },
    onError: () => {
      toast.error("Failed to like story");
    },
  });

  const dislikeMutation = useMutation({
    mutationFn: () => storyApi.dislikeStory(story._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["story", slug] });
      queryClient.invalidateQueries({ queryKey: ["story-stats", story._id] });
      toast.success("Like removed");
    },
    onError: () => {
      toast.error("Failed to remove like");
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => storyApi.bookmarkStory(story._id),
    onSuccess: (data) => {
      const isBookmarked = story.bookmarkedBy.includes(user?._id || "");
      if (isBookmarked) {
        dispatch(removeBookmark(story._id));
        toast.success("Bookmark removed");
      } else {
        dispatch(addBookmark(story._id));
        toast.success("Story bookmarked");
      }
      queryClient.invalidateQueries({ queryKey: ["story", slug] });
    },
    onError: () => {
      toast.error("Failed to update bookmark");
    },
  });

  const shareMutation = useMutation({
    mutationFn: () => storyApi.shareStory(story._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["story-stats", story._id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (permanent: boolean) =>
      storyApi.deleteStory(story._id, permanent),
    onSuccess: () => {
      toast.success("Story deleted successfully");
      navigate("/");
    },
    onError: () => {
      toast.error("Failed to delete story");
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => commentApi.addComment(story._id, content),
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["story", slug] });
      toast.success("Comment posted");
    },
    onError: () => {
      toast.error("Failed to post comment");
    },
  });

  // Handlers
  const handleLike = () => {
    if (!user) {
      toast.error("Please login to like stories");
      navigate("/login");
      return;
    }

    if (story.isLikedByUser) {
      dislikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  const sanitizedHtml = DOMPurify.sanitize(story?.content);

  const handleBookmark = () => {
    if (!user) {
      toast.error("Please login to bookmark stories");
      navigate("/login");
      return;
    }
    bookmarkMutation.mutate();
  };

  const handleShare = (platform?: string) => {
    const url = window.location.href;
    const text = `${story.title} by @${story.author.username}`;

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            text
          )}&url=${encodeURIComponent(url)}`
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            url
          )}`
        );
        break;
      case "linkedin":
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            url
          )}`
        );
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
        break;
      default:
        if (navigator.share) {
          navigator.share({ title: story.title, text: story.excerpt, url });
        }
    }

    shareMutation.mutate();
    setShowShareDialog(false);
  };

  const handleDelete = (permanent: boolean) => {
    deleteMutation.mutate(permanent);
    setShowDeleteDialog(false);
  };

  const handleComment = () => {
    if (!user) {
      toast.error("Please login to comment");
      navigate("/login");
      return;
    }

    if (!commentText.trim()) {
      toast.error("Please write a comment");
      return;
    }

    commentMutation.mutate(commentText);
  };

  // Loading state
  if (isLoading) {
    return <StoryDetailSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4">
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Story Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The story you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/")}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAuthor = user?._id === story?.author._id;

  return (
    <>
      {/* Reading Progress Bar */}
      <Progress
        value={readProgress}
        className="fixed top-0 left-0 right-0 h-1 z-50"
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section with Featured Image */}
        {story?.image && (
          <div className="relative h-[400px] md:h-[500px] w-full">
            <img
              src={story.image}
              alt={story.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 left-4 bg-background/20 backdrop-blur"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Category Badge */}
            <div className="absolute bottom-4 left-4">
              <Badge variant="secondary" className="text-sm">
                {story.category}
              </Badge>
            </div>
          </div>
        )}

        <div className="container max-w-4xl mx-auto px-4 py-8">
          <article>
            {/* Article Header */}
            <div className="space-y-4 mb-8">
              {/* Pinned Badge */}
              {story?.isPinned && (
                <Badge variant="default" className="gap-1">
                  <Pin className="h-3 w-3" />
                  Pinned Story
                </Badge>
              )}

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                {story?.title}
              </h1>

              {/* Excerpt */}
              {story?.excerpt && (
                <p className="text-xl text-muted-foreground">{story.excerpt}</p>
              )}

              {/* Author Info & Meta */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Link to={`/profile/${story?.author._id}`}>
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={story?.author.avatar}
                        alt={story?.author.username}
                      />
                      <AvatarFallback>
                        {story?.author.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link
                      to={`/profile/${story?.author._id}`}
                      className="font-semibold hover:underline"
                    >
                      {story?.author.username}
                    </Link>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(
                          new Date(story?.publishedAt || Date.now()),
                          "MMM dd, yyyy"
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {story?.readtime} min read
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {stats?.views || 0} views
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {isAuthor && (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/story/${story._id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Story Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setShowDeleteDialog(true)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Story
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pin className="h-4 w-4 mr-2" />
                            {story.isPinned ? "Unpin" : "Pin"} Story
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                  {!isAuthor && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Flag className="h-4 w-4 mr-2" />
                          Report Story
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Tags */}
              {story?.tags && story.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {story.tags.map((tag) => (
                    <Link key={tag} to={`/tag/${tag}`}>
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-secondary"
                      >
                        <Hash className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Separator className="mb-8" />

            {/* Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
              {/* {story?.content.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-4 leading-relaxed">
                  {paragraph}
                </p>
              ))} */}
              <div
                className="mb-4 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
              />
            </div>

            {/* Additional Images */}
            {story?.images && story.images.length > 0 && (
              <div className="grid gap-4 mb-8">
                {story.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Story image ${index + 1}`}
                    className="w-full rounded-lg"
                  />
                ))}
              </div>
            )}

            <Separator className="mb-6" />

            {/* Engagement Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={story?.isLikedByUser ? "default" : "outline"}
                        size="sm"
                        onClick={handleLike}
                        className="gap-2"
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4",
                            story?.isLikedByUser && "fill-current"
                          )}
                        />
                        {stats?.likes || 0}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {story?.isLikedByUser ? "Unlike" : "Like"} this story
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          story?.isBookmarkedByUser ? "default" : "outline"
                        }
                        size="sm"
                        onClick={handleBookmark}
                        className="gap-2"
                      >
                        <Bookmark
                          className={cn(
                            "h-4 w-4",
                            story?.isBookmarkedByUser && "fill-current"
                          )}
                        />
                        {stats?.bookmarks || 0}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {story?.isBookmarkedByUser
                          ? "Remove bookmark"
                          : "Bookmark"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShareDialog(true)}
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  {stats?.shares || 0}
                </Button>
              </div>

              {/* Engagement Score */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>
                  Engagement Score: {stats?.engagementScore?.toFixed(0) || 0}
                </span>
              </div>
            </div>

            {/* Author Card */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={story?.author.avatar}
                        alt={story?.author.username}
                      />
                      <AvatarFallback>
                        {story?.author.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">
                        {story?.author.username}
                      </h3>
                      {story?.author.bio && (
                        <p className="text-sm text-muted-foreground">
                          {story.author.bio}
                        </p>
                      )}
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>
                          {story?.author.followersCount || 0} followers
                        </span>
                        <span>
                          {story?.author.followingCount || 0} following
                        </span>
                      </div>
                    </div>
                  </div>
                  {!isAuthor && (
                    <Button
                      variant={
                        story?.author.isFollowing ? "outline" : "default"
                      }
                    >
                      {story?.author.isFollowing ? "Following" : "Follow"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            {story?.allowComments && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Comments ({stats?.comments || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Comment Input */}
                  {user ? (
                    <div className="space-y-4 mb-6">
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.photo} alt={user.username} />
                          <AvatarFallback>
                            {user.username[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <Textarea
                            placeholder="Share your thoughts..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="min-h-[100px]"
                          />
                          <div className="flex justify-end">
                            <Button
                              onClick={handleComment}
                              disabled={
                                !commentText.trim() || commentMutation.isPending
                              }
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Post Comment
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Alert className="mb-6">
                      <AlertDescription>
                        Please{" "}
                        <Link to="/login" className="font-medium underline">
                          login
                        </Link>{" "}
                        to comment on this story.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Comments List */}
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {story?.comments?.length > 0 ? (
                        story.comments.map((comment) => (
                          <CommentItem
                            key={comment._id}
                            comment={comment}
                            onReply={(text) => console.log("Reply:", text)}
                          />
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No comments yet. Be the first to comment!
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </article>

          {/* Related Stories */}
          {relatedStories.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Related Stories</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedStories.map((relatedStory) => (
                  <Card
                    key={relatedStory._id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <Link to={`/story/${relatedStory.slug}`}>
                      {relatedStory.image && (
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={relatedStory.image}
                            alt={relatedStory.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="line-clamp-2">
                          {relatedStory.title}
                        </CardTitle>
                        {relatedStory.excerpt && (
                          <CardDescription className="line-clamp-2">
                            {relatedStory.excerpt}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardFooter className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={relatedStory.author.avatar} />
                            <AvatarFallback>
                              {relatedStory.author.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{relatedStory.author.username}</span>
                          <span>•</span>
                          <span>{relatedStory.readtime} min read</span>
                        </div>
                      </CardFooter>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share this story</DialogTitle>
            <DialogDescription>
              Share "{story?.title}" with your network
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              onClick={() => handleShare("twitter")}
              className="gap-2"
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare("facebook")}
              className="gap-2"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare("linkedin")}
              className="gap-2"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare("copy")}
              className="gap-2"
            >
              <Link2 className="h-4 w-4" />
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this story? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(false)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Soft Delete
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => handleDelete(true)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Permanent Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Comment Component
const CommentItem = ({
  comment,
  onReply,
}: {
  comment: Comment;
  onReply: (text: string) => void;
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleReply = () => {
    if (replyText.trim()) {
      onReply(replyText);
      setReplyText("");
      setShowReplyForm(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.author.avatar} />
          <AvatarFallback>{comment.author.username[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{comment.author.username}</span>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
          <p className="text-sm">{comment.content}</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ThumbsUp className="h-3 w-3 mr-1" />
              {comment.likes?.length || 0}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              Reply
            </Button>
          </div>
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <div className="ml-12 space-y-2">
          <Textarea
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleReply}>
              Post Reply
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowReplyForm(false);
                setReplyText("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-12 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply._id} comment={reply} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
};

// Skeleton Component
const StoryDetailSkeleton = () => {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
};

export default StoryDetail;
