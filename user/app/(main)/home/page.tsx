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

  const handlePostSubmit = async () => {
    if (!newPost.trim()) return;
    setIsSubmitting(true);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('User not logged in');
        setIsSubmitting(false);
        return;
      }
      const postData = { userId, content: newPost };
      await apiRequest('posts', 'POST', postData);
      toast.success('Post created successfully!');
      setNewPost('');
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Post Creation Section */}
      <Card className="p-4 mb-6 shadow-md">
        <div className="flex gap-4">
          <Avatar>
            <img src={userProfile.profilePicture} alt="Profile" onError={(e) => (e.currentTarget.src = DEFAULT_AVATAR)} />
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="What's on your mind?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="mb-4 resize-none"
              rows={2}
            />
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Image className="w-4 h-4 text-primary" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Smile className="w-4 h-4 text-primary" />
                </Button>
              </div>
              <Button size="sm" onClick={handlePostSubmit} disabled={isSubmitting || !newPost.trim()}>
                <Send className="w-4 h-4 mr-2" /> Post
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
