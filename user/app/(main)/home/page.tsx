'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Image, Smile, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { apiRequest } from '@/app/apiconnector/api';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const DEFAULT_URL = "https://res.cloudinary.com/djvat4mcp/image/upload/v1741357526/zybt9ffewrjwhq7tyvy1.png";

export default function HomePage() {
  const [newPost, setNewPost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string>(DEFAULT_URL);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPreviews, setSelectedPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '💯', '🚀'];

  useEffect(() => {
    // Fetch profile picture from localStorage or API
    const fetchProfilePicture = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        const userResponse = await apiRequest(`users/${userId}`, 'GET');
        setProfilePicture(userResponse?.profilePicture || DEFAULT_URL);
      } catch (error) {
        console.error('Error fetching profile picture:', error);
        setProfilePicture(DEFAULT_URL);
      }
    };

    fetchProfilePicture();
  }, []);

  const handlePostSubmit = async () => {
    if (!newPost.trim() && selectedFiles.length === 0) return;
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
      await apiRequest('posts', 'POST', dataToBeSent);
      setNewPost('');
      setSelectedFiles([]);
      setSelectedPreviews([]);
      toast.success('Post created successfully!');
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedFiles.length + files.length > 4) {
      toast.error("You can only upload up to 4 files");
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);
    setSelectedPreviews(prev => [...prev, ...files.map(file => URL.createObjectURL(file))]);
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

            {/* Media Upload Preview */}
            {selectedPreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {selectedPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedPreviews(prev => prev.filter((_, i) => i !== index));
                        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* File Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />

            {/* Buttons for Upload & Emoji Picker */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {/* Image Upload Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()} // ✅ Works now!
                  className="hover-scale"
                >
                  <Image className="w-6 h-6 text-primary" />
                </Button>

                {/* Emoji Picker Button */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="hover-scale">
                      <Smile className="w-6 h-6 text-primary" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-2">
                    <div className="grid grid-cols-4 gap-2">
                      {emojis.map((emoji) => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-accent"
                          onClick={() => {
                            setNewPost((prev) => prev + emoji);
                          }}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Submit Post Button */}
              <Button
                size="sm"
                onClick={handlePostSubmit}
                disabled={isSubmitting || (!newPost.trim() && selectedFiles.length === 0)}
                className="hover-scale ml-auto"
              >
                {isSubmitting ? <span className="animate-spin mr-2"></span> : <Send className="w-4 h-4 mr-2" />}
                Post
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
