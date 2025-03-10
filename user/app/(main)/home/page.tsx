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

const fetchConnectionPosts = async () => {
  try {
    const userId = localStorage.getItem('userId') || "404";
    const connections = await apiRequest(`followers/${userId}/followed`, 'GET') || [];
    let allPosts = [];
    for (const connection of connections) {
      const userDetails = await apiRequest(`users/${connection.id}`, 'GET');
      if (userDetails.status !== 0) {
        const userPosts = await apiRequest(`posts/user/${connection.id}`, 'GET') || [];
        allPosts.push(...userPosts);
      }
    }
    return allPosts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    toast.error('Failed to fetch posts');
    return [];
  }
};

export default function HomePage() {
  const [newPost, setNewPost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [userProfile, setUserProfile] = useState({
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
