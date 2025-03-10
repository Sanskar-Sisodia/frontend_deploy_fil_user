'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, MoreHorizontal, Flag, MessageCircle, Heart, Repeat, Copy, Share2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { apiRequest } from '@/app/apiconnector/api';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface Post {
  id: string;
  author: Author;
  content: string;
  createdAt: string;
  reactions: number;
  likedBy: Reaction[];
  comments: number;
  commentsList: Comment[];
}

export default function HomePage() {
  const [newPost, setNewPost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [commentText, setCommentText] = useState('');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ id: string; name: string; profilePicture: string; email: string }>({
    id: '',
    name: '',
    profilePicture: DEFAULT_AVATAR,
    email: ''
  });

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

  useEffect(() => {
    const loadPosts = async () => {
      const posts = await fetchConnectionPosts();
      setPosts(posts);
    };
    loadPosts();
  }, []);

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
                  likedBy: [
                    ...post.likedBy,
                    { id: Date.now().toString(), user: { username: userProfile.name, avatar: userProfile.profilePicture }, emoji: '👍', createdAt: likeResponse.createdAt || new Date().toISOString() }
                  ]
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

  const handleCommentClick = (postId: string) => {
    setActiveCommentId(activeCommentId === postId ? null : postId);
    setCommentText('');
  };

  const submitComment = async (postId: string) => {
    if (!commentText.trim()) return;

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('User not logged in');
        return;
      }

      const response = await apiRequest(`comments?postId=${postId}&userId=${userId}&content=${commentText.trim()}`, 'POST');
      if (response) {
        const newCommentObj: Comment = {
          id: response.id || `temp-${Date.now()}`,
          user: { username: userProfile.name, avatar: userProfile.profilePicture },
          content: commentText.trim(),
          createdAt: new Date().toISOString()
        };

        setPosts(prevPosts => prevPosts.map(post =>
          post.id === postId
            ? { ...post, comments: post.comments + 1, commentsList: [newCommentObj, ...post.commentsList] }
            : post
        ));

        setCommentText('');
        toast.success('Comment added successfully');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {posts.map((post) => (
        <Card key={post.id} className="p-4 mb-4 shadow-md">
          <div className="flex items-center gap-3">
            <Avatar>
              <img src={post.author.profilePicture} alt={post.author.username} />
            </Avatar>
            <div>
              <h3>{post.author.username}</h3>
            </div>
          </div>

          <p>{post.content}</p>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => handleLikeClick(post.id)}>
              <Heart /> {post.reactions}
            </Button>

            <Button variant="ghost" onClick={() => handleCommentClick(post.id)}>
              <MessageCircle /> {post.comments}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
