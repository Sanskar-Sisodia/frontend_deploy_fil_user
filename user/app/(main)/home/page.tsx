'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Share2, Image, Video, Smile, Send, MoreHorizontal, Flag, MessageCircle, Heart, Repeat, Copy, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { apiRequest } from '@/app/apiconnector/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DEFAULT_AVATAR = "https://res.cloudinary.com/djvat4mcp/image/upload/v1741357526/zybt9ffewrjwhq7tyvy1.png";

interface Author {
  id: string;
  username: string;
  profilePicture: string;
}

interface Reaction {
  id: string;
  user: { username: string; avatar: string };
  emoji: string;
  createdAt: string;
}

interface Comment {
  id: string;
  user: { username: string; avatar: string };
  content: string;
  createdAt: string;
}

interface Media {
  id: string;
  mediaUrl: string;
  mediaType: string;
  postId: string;
}

interface Post {
  id: string;
  author: Author;
  content: string;
  createdAt: string;
  reactions: number;
  likedBy: Reaction[];
  comments: number;
  commentsList: Comment[];
  mediaUrls: Media[];
}

interface UserProfile {
  id: string;
  name: string;
  profilePicture: string;
  email: string;
}

export default function HomePage() {
  const [newPost, setNewPost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [commentText, setCommentText] = useState('');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '',
    name: '',
    profilePicture: DEFAULT_AVATAR,
    email: ''
  });

  useEffect(() => {
    const loadPosts = async () => {
      const posts = await fetchConnectionPosts();
      setPosts(posts);
    };
    loadPosts();
  }, []);

  const fetchConnectionPosts = async (): Promise<Post[]> => {
    try {
      const userId = localStorage.getItem('userId') || "404";
      const connections = await apiRequest(`followers/${userId}/followed`, 'GET') || [];
      const activeConnections = connections.filter((user: any) => user.status !== "0" && user.status !== 0);
      let allPosts: Post[] = [];
      for (const connection of activeConnections) {
        const userDetails = await apiRequest(`users/${connection.id}`, 'GET');
        if (userDetails.status !== 0) {
          const userPosts = await apiRequest(`posts/user/${connection.id}`, 'GET') || [];
          const activePosts: Post[] = userPosts.filter((post: any) => post.status === "1");
          allPosts.push(...activePosts);
        }
      }
      return allPosts;
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to fetch posts');
      return [];
    }
  };

  const handleLikeClick = async (postId: string) => {
    try {
      const userId = localStorage.getItem('userId') || "404";
      const currentPost = posts.find(post => post.id === postId);
      if (!currentPost) return;
      const hasLiked = currentPost.likedBy.some(like => like.user.username === userProfile.name);
      const url = `reactions/${postId}/${userId}`;
      if (hasLiked) {
        await apiRequest(url, 'DELETE');
        setPosts(prevPosts => prevPosts.map(post =>
          post.id === postId
            ? { ...post, reactions: post.reactions - 1, likedBy: post.likedBy.filter(like => like.user.username !== userProfile.name) }
            : post
        ));
        toast.error("Unliked this post!");
      } else {
        const likeResponse = await apiRequest(`${url}/👍`, 'POST');
        if (likeResponse) {
          setPosts(prevPosts => prevPosts.map(post =>
            post.id === postId
              ? {
                  ...post,
                  reactions: post.reactions + 1,
                  likedBy: [...post.likedBy, { id: Date.now().toString(), user: { username: userProfile.name, avatar: userProfile.profilePicture }, emoji: '👍', createdAt: likeResponse.createdAt || new Date().toISOString() }]
                }
              : post
          ));
          toast.success("Post liked!");
        }
      }
    } catch (error) {
      console.error('Error liking/unliking post:', error);
      toast.error("Failed to update like");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">{/* UI for homepage with posts */}</div>
  );
}
