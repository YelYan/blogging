import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { storyApi } from "@/services/story.api";
import HeroSection from "@/components/home/HeroSection";
import FeaturedStories from "@/components/home/FeaturedStories";
import StoryGrid from "@/components/home/StoryGrid";
import CategoryFilter from "@/components/home/CategoryFilter";
import TrendingSection from "@/components/home/TrendingSection";
import NewsletterSection from "@/components/home/NewsLetterSection";
import StatsSection from "@/components/home/StatsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Clock, MessageCircle } from "lucide-react";

export default function Home() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    "latest" | "popular" | "oldest" | "mostCommented"
  >("latest");

  const { data: storiesData, isLoading: storiesLoading } = useQuery({
    queryKey: ["stories", page, search, selectedCategory, sortBy],
    queryFn: () =>
      storyApi.getStories({
        page,
        limit: 9,
        search: search || undefined,
        category: selectedCategory || undefined,
        sortBy,
      }),
  });

  const { data: featuredData } = useQuery({
    queryKey: ["featured-stories"],
    queryFn: storyApi.getFeaturedStories,
  });

  const { data: trendingData } = useQuery({
    queryKey: ["trending-stories"],
    queryFn: storyApi.getTrendingStories,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: storyApi.getCategories,
  });

  const { data: statsData } = useQuery({
    queryKey: ["story-stats"],
    queryFn: storyApi.getStoryStats,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      {statsData && <StatsSection stats={statsData.data} />}

      {/* Featured Stories */}
      {featuredData && featuredData.data.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <FeaturedStories stories={featuredData.data} />
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Left Sidebar - Categories & Trending */}
            <aside className="lg:col-span-1 space-y-6">
              {/* Search */}
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Search className="mr-2 h-4 w-4" />
                  Search Stories
                </h3>
                <form onSubmit={handleSearch} className="space-y-2">
                  <Input
                    type="search"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button type="submit" className="w-full" size="sm">
                    Search
                  </Button>
                </form>
              </div>

              {/* Categories */}
              {categoriesData && (
                <CategoryFilter
                  categories={categoriesData.data}
                  selectedCategory={selectedCategory}
                  onCategoryChange={(category) => {
                    setSelectedCategory(category);
                    setPage(1);
                  }}
                />
              )}

              {/* Trending */}
              {trendingData && trendingData.data.length > 0 && (
                <TrendingSection stories={trendingData.data} />
              )}
            </aside>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {/* Sort Tabs */}
              <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <TabsList className="mb-6">
                  <TabsTrigger value="latest" className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Latest
                  </TabsTrigger>
                  <TabsTrigger value="popular" className="flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Popular
                  </TabsTrigger>
                  <TabsTrigger
                    value="mostCommented"
                    className="flex items-center"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Most Discussed
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={sortBy}>
                  <StoryGrid
                    stories={storiesData?.data || []}
                    loading={storiesLoading}
                    page={page}
                    totalPages={storiesData?.totalPages || 1}
                    onPageChange={setPage}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <NewsletterSection />
    </div>
  );
}
