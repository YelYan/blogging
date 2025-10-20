export interface User {
  _id: string;
  id: string;
  username: string;
  email: string;
  photo: string;
  role: 'user' | 'admin';
  bio?: string;
  readList?: string[];
  readListLength?: number;
  bookmarks?: string[];
  followers?: string[];
  followersCount?: number;
  following?: string[];
  followingCount?: number;
  stories?: string[];
  storyCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  _id: string;
  author: User | string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  image: string;
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
  comments: Comment[] | string[];
  commentCount: number;
  views: number;
  viewedBy?: { user: string; viewedAt: string }[];
  bookmarkedBy: string[];
  bookmarkCount: number;
  shares: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  status: 'draft' | 'published' | 'archived' | 'deleted';
  allowComments: boolean;
  isPinned: boolean;
  lastEditedAt?: string;
  editHistory?: EditHistory[];
  engagementScore?: number;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
  isDisliked?: boolean;
  isBookmarked?: boolean;
  isAuthor?: boolean;
  canEdit?: boolean;
}

export interface Comment {
  _id: string;
  story: string;
  content: string;
  author: User | string;
  likes: string[];
  likeCount: number;
  star: number;
  createdAt: string;
  updatedAt: string;
}

export interface EditHistory {
  editedBy: string;
  editedAt: string;
  changes: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface StoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  tags?: string;
  author?: string;
  sortBy?: 'latest' | 'popular' | 'oldest' | 'mostCommented' | 'mostViewed' | 'mostLiked';
  status?: 'draft' | 'published' | 'archived' | 'deleted';
  featured?: boolean;
  startDate?: string;
  endDate?: string;
  minReadTime?: number;
  maxReadTime?: number;
}

export interface StoriesResponse {
  success: boolean;
  count: number;
  total: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  data: Story[];
}

export interface StoryStats {
  views: number;
  uniqueViews: number;
  likes: number;
  dislikes: number;
  comments: number;
  bookmarks: number;
  shares: number;
  engagementScore: number;
  readTime: number;
  viewsByDay: Record<string, number>;
  averageRating: number;
  lastViewed: string | null;
}

export const CATEGORIES = [
  'Technology',
  'Programming',
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'DevOps',
  'Cybersecurity',
  'Design',
  'Business',
  'Career',
  'Lifestyle',
  'Tutorial',
  'Opinion',
  'News',
  'Other'
] as const;

export type Category = typeof CATEGORIES[number];