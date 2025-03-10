'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Share2, Image, Video, Smile, Send, MoreHorizontal, Flag, MessageCircle, Heart, Repeat, Copy, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { apiRequest } from '@/app/apiconnector/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const DEFAULT_URL = "https://res.cloudinary.com/djvat4mcp/image/upload/v1741357526/zybt9ffewrjwhq7tyvy1.png";
const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/djvat4mcp/image/upload/v1741357526/";
const DEFAULT_AVATAR = DEFAULT_URL;

interface Author {
  id: string;
  username: string;
  profilePicture: string;
}

interface Reaction {
  id: string;
  user: {
    username: string;
    avatar: string;
  };
  emoji: string;
  createdAt: string;
}

interface Comment {
  id: string;
  user: {
    username: string;
    avatar: string;
  };
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

export default function HomePage() {
  const [newPost, setNewPost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string>(DEFAULT_URL);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPreviews, setSelectedPreviews] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]); // ✅ Fixed TypeScript issue here
  const [commentText, setCommentText] = useState('');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadPosts = async () => {
      const posts: Post[] = await fetchConnectionPosts(); // ✅ Ensured this function returns Post[]
      setPosts(posts);
    };
    loadPosts();
  }, []);

  const fetchConnectionPosts = async (): Promise<Post[]> => {
    try {
      const userId = localStorage.getItem('userId') || "404";
      const connections = await apiRequest(`followers/${userId}/followed`, 'GET') || [];
      let allPosts: Post[] = [];

      for (const connection of connections) {
        const userPosts = await apiRequest(`posts/user/${connection.id}`, 'GET') || [];
        const activePosts = userPosts.filter((post: any) => post.status === "1");

        for (const post of activePosts) {
          const enrichedPost: Post = {
            id: post.id,
            author: {
              id: post.user.id,
              username: post.user.username,
              profilePicture: post.user.profilePicture ? post.user.profilePicture : DEFAULT_AVATAR
            },
            content: post.content,
            createdAt: post.createdAt,
            reactions: 0,
            likedBy: [],
            comments: 0,
            commentsList: [],
            mediaUrls: post.mediaUrls || []
          };
          allPosts.push(enrichedPost);
        }
      }

      return allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to fetch posts');
      return [];
    }
  };

  const handlePostSubmit = async () => {
    if (!newPost.trim()) return;
    setIsSubmitting(true);

    const userId = localStorage.getItem("userId");
    if (!userId) {
      setIsSubmitting(false);
      return;
    }

    const dataToBeSent = {
      userId: userId,
      title: "New Post",
      content: newPost,
      status: "1",
      mediaUrls: []
    };

    try {
      const res = await apiRequest('posts', 'POST', dataToBeSent);
      setNewPost('');
      setPosts(prevPosts => [{ ...res, author: { id: userId, username: "You", profilePicture } }, ...prevPosts]);
      toast.success('Post created successfully!');
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="p-4 mb-6 shadow-md">
        <div className="flex gap-4">
          <Avatar className="w-10 h-10">
            <img src={profilePicture} alt="Profile" />
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="What's on your mind?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="mb-4 resize-none"
              rows={2}
            />
            <div className="flex justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()} 
              >
                <Image className="w-4 h-4 mr-2 text-primary" />
              </Button>
              <Button size="sm" onClick={handlePostSubmit} disabled={isSubmitting || !newPost.trim()}>
                {isSubmitting ? <span className="animate-spin mr-2"></span> : <Send className="w-4 h-4 mr-2" />}
                Post
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {posts.map((post) => (
        <Card key={post.id} className="p-4 mb-4 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-10 h-10">
              <img src={post.author.profilePicture} alt={post.author.username} />
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{post.author.username}</h3>
            </div>
          </div>
          <p className="mb-4">{post.content}</p>
          <Separator className="my-4" />
          <div className="flex justify-between">
            <Button variant="ghost" size="sm">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
