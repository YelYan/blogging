import { Card } from "@/components/ui/card";
import { BookOpen, Users, Heart, MessageCircle } from "lucide-react";

interface StatsSectionProps {
  stats: {
    stories: number;
    authors: number;
    likes: number;
    comments: number;
  };
}

export default function StatsSection({ stats }: StatsSectionProps) {
  const statItems = [
    {
      label: "Stories",
      value: stats.stories,
      icon: BookOpen,
      color: "text-blue-500",
    },
    {
      label: "Authors",
      value: stats.authors,
      icon: Users,
      color: "text-green-500",
    },
    { label: "Likes", value: stats.likes, icon: Heart, color: "text-red-500" },
    {
      label: "Comments",
      value: stats.comments,
      icon: MessageCircle,
      color: "text-purple-500",
    },
  ];

  return (
    <section className="py-12 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {item.value.toLocaleString()}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${item.color}`} />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
