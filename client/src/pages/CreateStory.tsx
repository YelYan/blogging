// pages/CreateStory.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { storyApi } from "@/services/story.api";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Form validation schema
const createStorySchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be less than 100 characters"),
  excerpt: z
    .string()
    .max(200, "Excerpt must be less than 200 characters")
    .optional(),
  content: z.string().min(100, "Content must be at least 100 characters"),
  category: z.string().min(1, "Please select a category"),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
});

type CreateStoryFormData = z.infer<typeof createStorySchema>;

const CreateStory = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  // State management
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form setup
  const form = useForm<CreateStoryFormData>({
    resolver: zodResolver(createStorySchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      category: "",
      featured: false,
      status: "draft",
    },
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: storyApi.getCategories,
  });

  // Fetch existing tags for suggestions
  const { data: existingTags = [] } = useQuery<string[]>({
    queryKey: ["tags"],
    queryFn: storyApi.getTags,
  });

  // Create story mutation
  const createStoryMutation = useMutation({
    mutationFn: async (data: FormData) => {
      setIsSubmitting(true);
      return storyApi.createStory(data);
    },
    onSuccess: (data) => {
      toast.success("Story created successfully!", {
        description: "Your story has been published.",
      });
      navigate(`/story/${data.data.slug}`);
    },
    onError: (error: any) => {
      toast.error("Failed to create story", {
        description: error.response?.data?.message || "Please try again later.",
      });
      setIsSubmitting(false);
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
  const onSubmit = async (data: CreateStoryFormData) => {
    if (!user) {
      toast.error("Authentication required", {
        description: "Please login to create a story.",
      });
      navigate("/login");
      return;
    }

    const formData = new FormData();

    // Append form fields
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    // Append tags
    if (selectedTags.length > 0) {
      formData.append("tags", JSON.stringify(selectedTags));
    }

    // Append image
    if (imageFile) {
      formData.append("image", imageFile);
    }

    createStoryMutation.mutate(formData);
  };

  // Calculate stats
  const wordCount =
    form.watch("content")?.split(/\s+/).filter(Boolean).length || 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create Story</h1>
              <p className="text-muted-foreground">
                Share your thoughts with the world
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Content Area */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Story Content</CardTitle>
                    <CardDescription>
                      Write your story content here
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
                            {field.value.length}/100 characters
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
                            {field.value?.length || 0}/200 characters
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
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Publishing Options */}
                <Card>
                  <CardHeader>
                    <CardTitle>Publishing Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                              {categories?.data?.map(
                                (category: {
                                  _id: string;
                                  count: number;
                                  totalViews: number;
                                  totalLikes: number;
                                }) => (
                                  <SelectItem
                                    key={category._id}
                                    value={category._id}
                                  >
                                    {category._id}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Featured Toggle */}
                    <FormField
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Featured Story
                            </FormLabel>
                            <FormDescription>
                              Mark this story as featured
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
                        type="button"
                        className="w-full"
                        disabled={isSubmitting}
                        onClick={() => {
                          form.setValue("status", "published");
                          form.handleSubmit(onSubmit)();
                        }}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Publish Story
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        disabled={isSubmitting}
                        onClick={() => {
                          form.setValue("status", "draft");
                          form.handleSubmit(onSubmit)();
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save as Draft
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Featured Image */}
                <Card>
                  <CardHeader>
                    <CardTitle>Featured Image</CardTitle>
                    <CardDescription>
                      Add a cover image for your story
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
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tags</CardTitle>
                    <CardDescription>
                      Add up to 5 tags to help readers find your story
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

                {/* Author Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Author</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <img
                        src={user?.photo || "/default-avatar.png"}
                        alt={user?.username}
                        className="h-10 w-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium">{user?.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {user?.followersCount || 0} followers
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Story Preview</DialogTitle>
            <DialogDescription>
              This is how your story will appear to readers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
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
                <span>{user?.username}</span>
                <span>•</span>
                <span>{new Date().toLocaleDateString()}</span>
                <span>•</span>
                <span>{readTime} min read</span>
              </div>

              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

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
    </div>
  );
};

export default CreateStory;
