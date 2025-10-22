import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { storyApi } from "@/services/story.api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  X,
  Save,
  Send,
  Image as ImageIcon,
  Loader2,
  Plus,
  ChevronLeft,
  Hash,
  Eye,
  EyeOff,
  History,
  Archive,
  AlertCircle,
  CheckCircle,
  FileText,
  Undo2,
} from "lucide-react";

// Shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Form validation schema
const editStorySchema = z.object({
  title: z
    .string()
    .min(4, "Title must be at least 4 characters")
    .max(200, "Title must be less than 200 characters"),
  excerpt: z
    .string()
    .max(500, "Excerpt must be less than 500 characters")
    .optional(),
  content: z.string().min(10, "Content must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]).default("published"),
  allowComments: z.boolean().default(true),
  isPinned: z.boolean().default(false),
  metaTitle: z
    .string()
    .max(60, "Meta title must be less than 60 characters")
    .optional(),
  metaDescription: z
    .string()
    .max(160, "Meta description must be less than 160 characters")
    .optional(),
});

type EditStoryFormData = z.infer<typeof editStorySchema>;

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface EditHistory {
  editedBy: {
    _id: string;
    username: string;
    avatar?: string;
  };
  editedAt: string;
  changes: string;
}

interface Story {
  _id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  image?: string;
  images?: string[];
  category: string;
  tags: string[];
  featured: boolean;
  published: boolean;
  status: string;
  allowComments: boolean;
  isPinned: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  lastEditedAt?: string;
  editHistory?: EditHistory[];
  createdAt: string;
  updatedAt: string;
}

const EditStory = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);

  // State management
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [originalData, setOriginalData] = useState<Story | null>(null);
  const [changedFields, setChangedFields] = useState<string[]>([]);

  // Form setup
  const form = useForm<EditStoryFormData>({
    resolver: zodResolver(editStorySchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      category: "",
      featured: false,
      status: "published",
      allowComments: true,
      isPinned: false,
      metaTitle: "",
      metaDescription: "",
    },
  });

  // Fetch story data
  const {
    data: storyData,
    isLoading: storyLoading,
    isError,
    error,
  } = useQuery<{ data: Story }>({
    queryKey: ["story-edit", id],
    queryFn: () => storyApi.getStory(id!),
    enabled: !!id,
  });

  const story = storyData?.data;

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<
    Category[]
  >({
    queryKey: ["categories"],
    queryFn: storyApi.getCategories,
  });

  // Fetch existing tags for suggestions
  const { data: existingTags = [] } = useQuery<string[]>({
    queryKey: ["tags"],
    queryFn: storyApi.getTags,
  });

  // Initialize form with story data
  useEffect(() => {
    if (story) {
      // Check if user is the author
      if (story.author._id !== user?._id) {
        toast.error("You don't have permission to edit this story");
        navigate(`/story/${story.slug}`);
        return;
      }

      setOriginalData(story);

      form.reset({
        title: story.title,
        excerpt: story.excerpt || "",
        content: story.content,
        category: story.category,
        featured: story.featured,
        status: story.status as "draft" | "published" | "archived",
        allowComments: story.allowComments,
        isPinned: story.isPinned,
        metaTitle: story.metaTitle || "",
        metaDescription: story.metaDescription || "",
      });

      setSelectedTags(story.tags || []);
      if (story.image) {
        setImagePreview(story.image);
      }
    }
  }, [story, form, user, navigate]);

  // Track form changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (originalData && name) {
        const currentValues = form.getValues();
        const differences = Object.keys(currentValues).filter((key) => {
          const originalValue = originalData[key as keyof Story];
          const currentValue = currentValues[key as keyof EditStoryFormData];
          return originalValue !== currentValue;
        });

        setChangedFields(differences);
        setHasUnsavedChanges(
          differences.length > 0 ||
            JSON.stringify(selectedTags) !==
              JSON.stringify(originalData.tags) ||
            imageFile !== null
        );
      }
    });

    return () => subscription.unsubscribe();
  }, [form, originalData, selectedTags, imageFile]);

  // Prevent navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Update story mutation
  const updateStoryMutation = useMutation({
    mutationFn: async (data: FormData) => {
      setIsSubmitting(true);
      return storyApi.updateStory(id!, data);
    },
    onSuccess: (data) => {
      toast.success("Story updated successfully!", {
        description: "Your changes have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["story", story?.slug] });
      queryClient.invalidateQueries({ queryKey: ["story-edit", id] });
      setHasUnsavedChanges(false);
      navigate(`/story/${data.data.slug}`);
    },
    onError: (error: any) => {
      toast.error("Failed to update story", {
        description: error.response?.data?.message || "Please try again later.",
      });
      setIsSubmitting(false);
    },
  });

  // Archive story mutation
  const archiveStoryMutation = useMutation({
    mutationFn: () => storyApi.updateStory(id!, { status: "archived" }),
    onSuccess: () => {
      toast.success("Story archived successfully");
      navigate(`/story/${story?.slug}`);
    },
    onError: () => {
      toast.error("Failed to archive story");
    },
  });

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image too large", {
          description: "Please select an image smaller than 5MB.",
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Tag management
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (
      trimmedTag &&
      !selectedTags.includes(trimmedTag) &&
      selectedTags.length < 5
    ) {
      setSelectedTags([...selectedTags, trimmedTag]);
      setTagInput("");
    } else if (selectedTags.length >= 5) {
      toast.warning("Tag limit reached", {
        description: "You can only add up to 5 tags.",
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  // Form submission
  const onSubmit = async (data: EditStoryFormData) => {
    if (!user) {
      toast.error("Authentication required");
      navigate("/login");
      return;
    }

    const formData = new FormData();

    // Track changes for edit history
    const changes: string[] = [];
    changedFields.forEach((field) => {
      changes.push(`Updated ${field}`);
      formData.append(
        field,
        data[field as keyof EditStoryFormData]?.toString() || ""
      );
    });

    // Only append changed fields
    if (JSON.stringify(selectedTags) !== JSON.stringify(originalData?.tags)) {
      formData.append("tags", JSON.stringify(selectedTags));
      changes.push("Updated tags");
    }

    // Append image if changed
    if (imageFile) {
      formData.append("image", imageFile);
      changes.push("Updated featured image");
    }

    // Add edit history
    formData.append(
      "editHistory",
      JSON.stringify({
        changes: changes.join(", "),
      })
    );

    updateStoryMutation.mutate(formData);
  };

  // Discard changes
  const handleDiscardChanges = () => {
    if (originalData) {
      form.reset({
        title: originalData.title,
        excerpt: originalData.excerpt || "",
        content: originalData.content,
        category: originalData.category,
        featured: originalData.featured,
        status: originalData.status as "draft" | "published" | "archived",
        allowComments: originalData.allowComments,
        isPinned: originalData.isPinned,
        metaTitle: originalData.metaTitle || "",
        metaDescription: originalData.metaDescription || "",
      });
      setSelectedTags(originalData.tags || []);
      setImagePreview(originalData.image || null);
      setImageFile(null);
      setHasUnsavedChanges(false);
      setChangedFields([]);
    }
    setShowDiscardDialog(false);
  };

  // Calculate stats
  const wordCount =
    form.watch("content")?.split(/\s+/).filter(Boolean).length || 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  // Loading state
  if (storyLoading) {
    return <EditStorySkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <div className="container max-w-5xl mx-auto py-16 px-4">
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Failed to Load Story</h2>
            <p className="text-muted-foreground mb-4">
              {error?.message || "The story could not be loaded for editing."}
            </p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (hasUnsavedChanges) {
                  setShowDiscardDialog(true);
                } else {
                  navigate(-1);
                }
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Story</h1>
              <p className="text-muted-foreground">
                Last edited{" "}
                {story?.lastEditedAt
                  ? formatDistanceToNow(new Date(story.lastEditedAt), {
                      addSuffix: true,
                    })
                  : "never"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Unsaved changes
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {showPreview ? "Edit" : "Preview"}
            </Button>
          </div>
        </div>

        {/* Changed Fields Alert */}
        {changedFields.length > 0 && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Changes Detected</AlertTitle>
            <AlertDescription>
              Modified fields: {changedFields.join(", ")}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Content Area */}
              <div className="lg:col-span-2 space-y-6">
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="seo">SEO Settings</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Story Content</CardTitle>
                        <CardDescription>
                          Edit your story content
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Title Field */}
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your story title..."
                                  className="text-2xl font-semibold h-auto py-3"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                {field.value.length}/200 characters
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Excerpt Field */}
                        <FormField
                          control={form.control}
                          name="excerpt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Excerpt</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Brief description of your story..."
                                  className="resize-none"
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                {field.value?.length || 0}/500 characters
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Content Field */}
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Content</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Start writing your story..."
                                  className="min-h-[400px] resize-none font-serif text-lg"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                {wordCount} words • {readTime} min read
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="seo" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>SEO Settings</CardTitle>
                        <CardDescription>
                          Optimize your story for search engines
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Meta Title */}
                        <FormField
                          control={form.control}
                          name="metaTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Title</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="SEO title (defaults to story title)"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                {field.value?.length || 0}/60 characters
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Meta Description */}
                        <FormField
                          control={form.control}
                          name="metaDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="SEO description (defaults to excerpt)"
                                  rows={3}
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                {field.value?.length || 0}/160 characters
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Publishing Options */}
                <Card>
                  <CardHeader>
                    <CardTitle>Publishing Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Status Selection */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Draft
                                </div>
                              </SelectItem>
                              <SelectItem value="published">
                                <div className="flex items-center gap-2">
                                  <Send className="h-4 w-4" />
                                  Published
                                </div>
                              </SelectItem>
                              <SelectItem value="archived">
                                <div className="flex items-center gap-2">
                                  <Archive className="h-4 w-4" />
                                  Archived
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Category Selection */}
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={categoriesLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.data?.map((category) => (
                                <SelectItem
                                  key={category._id}
                                  value={category.name}
                                >
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Toggle Options */}
                    <FormField
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Featured
                            </FormLabel>
                            <FormDescription>
                              Show in featured section
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isPinned"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Pinned</FormLabel>
                            <FormDescription>
                              Pin to top of your profile
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="allowComments"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Comments
                            </FormLabel>
                            <FormDescription>
                              Allow readers to comment
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting || !hasUnsavedChanges}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>

                      {hasUnsavedChanges && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => setShowDiscardDialog(true)}
                        >
                          <Undo2 className="h-4 w-4 mr-2" />
                          Discard Changes
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        onClick={() => archiveStoryMutation.mutate()}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive Story
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Featured Image */}
                <Card>
                  <CardHeader>
                    <CardTitle>Featured Image</CardTitle>
                    <CardDescription>
                      Update the cover image for your story
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!imagePreview ? (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                        <input
                          type="file"
                          id="image-upload"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                          <span className="text-sm font-medium">
                            Click to upload
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            PNG, JPG up to 5MB
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          {imageFile && (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700"
                            >
                              New
                            </Badge>
                          )}
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={removeImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tags</CardTitle>
                    <CardDescription>
                      Update tags to help readers find your story
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Selected Tags */}
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="pl-2">
                            <Hash className="h-3 w-3 mr-1" />
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 ml-1 hover:bg-transparent"
                              onClick={() => removeTag(tag)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Tag Input */}
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagInputKeyDown}
                        placeholder="Add a tag..."
                        disabled={selectedTags.length >= 5}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => addTag(tagInput)}
                        disabled={selectedTags.length >= 5}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Tag Suggestions */}
                    {existingTags.length > 0 && selectedTags.length < 5 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Popular tags:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {existingTags
                            .filter((tag) => !selectedTags.includes(tag))
                            .slice(0, 5)
                            .map((tag) => (
                              <Button
                                key={tag}
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => addTag(tag)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {tag}
                              </Button>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Story Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Story Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Author:</span>
                      <span className="font-medium">
                        {story?.author.username}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium">
                        {story?.createdAt &&
                          formatDistanceToNow(new Date(story.createdAt), {
                            addSuffix: true,
                          })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Last Updated:
                      </span>
                      <span className="font-medium">
                        {story?.updatedAt &&
                          formatDistanceToNow(new Date(story.updatedAt), {
                            addSuffix: true,
                          })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Views:</span>
                      <span className="font-medium">{story?.views || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Likes:</span>
                      <span className="font-medium">
                        {story?.likeCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comments:</span>
                      <span className="font-medium">
                        {story?.commentCount || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </div>

      {/* Edit History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Edit History</DialogTitle>
            <DialogDescription>
              View all changes made to this story
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {story?.editHistory && story.editHistory.length > 0 ? (
                story.editHistory.map((edit, index: number) => (
                  <div
                    key={index}
                    className="flex gap-3 pb-4 border-b last:border-0"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={edit.editedBy.avatar} />
                      <AvatarFallback>
                        {edit.editedBy.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {edit.editedBy.username}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(edit.editedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {edit.changes}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No edit history available
                </p>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistory(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Story Preview</DialogTitle>
            <DialogDescription>
              Preview your changes before saving
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                {imageFile && (
                  <Badge className="absolute top-2 right-2" variant="secondary">
                    New Image
                  </Badge>
                )}
              </div>
            )}

            <div>
              <h2 className="text-3xl font-bold mb-2">
                {form.watch("title") || "Untitled Story"}
              </h2>

              {form.watch("excerpt") && (
                <p className="text-lg text-muted-foreground italic mb-4">
                  {form.watch("excerpt")}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span>{story?.author.username}</span>
                <span>•</span>
                <span>{new Date().toLocaleDateString()}</span>
                <span>•</span>
                <span>{readTime} min read</span>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Badge>{form.watch("category") || "Uncategorized"}</Badge>
                {form.watch("status") === "draft" && (
                  <Badge variant="secondary">Draft</Badge>
                )}
                {form.watch("featured") && (
                  <Badge variant="default">Featured</Badge>
                )}
                {form.watch("isPinned") && (
                  <Badge variant="default">Pinned</Badge>
                )}
              </div>

              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              <Separator className="my-4" />

              <div className="prose prose-lg max-w-none">
                {form
                  .watch("content")
                  ?.split("\n")
                  .map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  )) || (
                  <p className="text-muted-foreground">No content yet...</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discard Changes Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardChanges}
              className="bg-destructive hover:bg-destructive/90"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Skeleton Component
const EditStorySkeleton = () => {
  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-96 w-full" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditStory;
