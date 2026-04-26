import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { toast } from "react-toastify";
import { Heart, MessageCircle, Share2, Trash2, Image as ImageIcon, Video, Send, PlusCircle } from "lucide-react";

export default function PublicSpace() {
  const user = useSelector(selectuser);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendCount, setFriendCount] = useState(0);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [dailyPostCount, setDailyPostCount] = useState(0);
  
  // Post states
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState(""); // Can be base64 or URL
  const [mediaType, setMediaType] = useState<"image" | "video" | "none">("none");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPosting, setIsPosting] = useState(false);
  const [page, setPage] = useState(1);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const friendRes = await axios.get(`https://internshala-clone-ydgs.onrender.com/api/public-space/friends/${user.uid}`);
      setFriendCount(friendRes.data.count);
      setFriendsList(friendRes.data.friends || []);
      
      const countRes = await axios.get(`https://internshala-clone-ydgs.onrender.com/api/public-space/daily-count/${user.uid}`);
      setDailyPostCount(countRes.data.count);

      const suggestedRes = await axios.get(`https://internshala-clone-ydgs.onrender.com/api/public-space/suggested-friends/${user.uid}?currentEmail=${user.email || ""}`);
      if(suggestedRes.data.success) {
        setSuggestedUsers(suggestedRes.data.suggested);
      }
    } catch (err) {
      console.error("Failed to fetch user stats", err);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`https://internshala-clone-ydgs.onrender.com/api/public-space/feed?page=${page}&limit=20`);
      setPosts(res.data.posts);
    } catch (err) {
      toast.error("Failed to fetch feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB max for base64 direct DB storage
    // MongoDB has a strict 16MB BSON record limit.
    const MAX_SIZE = 5 * 1024 * 1024; 
    if (file.size > MAX_SIZE) {
      toast.error(`File is too large! Please upload a file smaller than 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      e.target.value = "";
      return;
    }

    // Simulate upload progress
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 20;
      });
    }, 200);

    const reader = new FileReader();
    reader.onloadend = () => {
      clearInterval(interval);
      setUploadProgress(100);
      setMediaUrl(reader.result as string);
      setMediaType(type);
      setTimeout(() => setUploadProgress(0), 1000);
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async () => {
    if (!user) return toast.error("Please login first");
    if (!caption && !mediaUrl) return toast.info("Post cannot be empty");
    
    setIsPosting(true);
    try {
      const hashtags = caption.match(/#[\w]+/g) || [];
      const res = await axios.post("https://internshala-clone-ydgs.onrender.com/api/public-space/post", {
        userUid: user.uid,
        userName: user.name,
        userPhoto: user.photo,
        caption,
        mediaUrl,
        mediaType,
        hashtags,
      });

      if (res.data.success) {
        toast.success("Posted successfully!");
        setCaption("");
        setMediaUrl("");
        setMediaType("none");
        fetchStats();
        fetchPosts(); // Refresh feed
      } else {
        toast.error(res.data.message || "Failed to post");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setIsPosting(false);
    }
  };

  const handleAddRealFriend = async (friendUid: string) => {
    if (!user) return toast.error("Please login first");
    if (user.uid === friendUid) return toast.error("You cannot add yourself");
    
    try {
      const res = await axios.post("https://internshala-clone-ydgs.onrender.com/api/public-space/friends/add", {
        uid: user.uid,
        friendUid: friendUid
      });
      if(res.data.success) {
        toast.success("Friend added successfully!");
        fetchStats();
      }
    } catch(err) {
      toast.error("Failed to add friend");
    }
  };

  const likePost = async (postId: string) => {
    if (!user) return toast.error("Please login to like");
    try {
      const res = await axios.post(`https://internshala-clone-ydgs.onrender.com/api/public-space/post/${postId}/like`, { uid: user.uid });
      if (res.data.success) {
        setPosts(posts.map(p => p._id === postId ? { ...p, likes: res.data.likes } : p));
      }
    } catch (err) {
      toast.error("Failed to like");
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await axios.delete(`https://internshala-clone-ydgs.onrender.com/api/public-space/post/${postId}?uid=${user.uid}`);
      toast.success("Post deleted");
      setPosts(posts.filter(p => p._id !== postId));
      fetchStats();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleSearchUsers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await axios.get(`https://internshala-clone-ydgs.onrender.com/api/public-space/search-users?q=${q}&currentUid=${user.uid}&currentEmail=${user.email || ""}`);
      if (res.data.success) setSearchResults(res.data.users);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Public Space</h1>
        <p className="text-gray-500 mb-6">Please login to join the community and see posts!</p>
      </div>
    );
  }

  // Determine Daily Posting limit text
  let limitText = "";
  if (friendCount === 0) limitText = "You have 0 friends. Add friends to post.";
  else if (friendCount === 1) limitText = "You can post 1 time per day.";
  else if (friendCount === 2) limitText = "You can post 2 times per day.";
  else if (friendCount >= 3 && friendCount <= 10) limitText = `You can post ${friendCount} times per day.`;
  else limitText = "You can post unlimited times per day!";

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Sidebar: Profile & Rules */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <img src={user.photo || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} alt="user" className="w-20 h-20 rounded-full border-4 border-blue-50 mb-4" />
            <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-gray-500 text-sm mb-4">{user.email}</p>
            
            <div className="w-full flex justify-around border-t pt-4">
              <div>
                <p className="font-bold text-gray-800 text-lg">{friendCount}</p>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Friends</p>
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">{dailyPostCount}</p>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Posts Today</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-2">Posting Limits <span className="text-blue-500 text-sm font-normal ml-1">(Your Status)</span></h3>
            <p className="text-sm font-semibold text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100">{limitText}</p>
            
            <ul className="text-xs text-gray-500 mt-4 space-y-2 list-disc pl-4">
              <li>0 Friends: Cannot post.</li>
              <li>1 Friend: 1 post/day.</li>
              <li>2 Friends: 2 posts/day.</li>
              <li>3 to 10 Friends: Equal to friends count.</li>
              <li>11+ Friends: Unlimited.</li>
            </ul>
          </div>

          {/* My Friends Widget */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex justify-between items-center">
              My Friends <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">{friendCount}</span>
            </h3>
            {friendsList.length > 0 ? (
              <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                {friendsList.map((f: any) => (
                  <div key={f.uid} className="flex items-center gap-3">
                    <img src={f.photo || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} className="w-8 h-8 rounded-full border border-gray-100" alt="" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800 leading-tight">{f.name}</span>
                      {f.email && <span className="text-xs text-gray-500 truncate w-32">{f.email}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">You don't have any friends yet.</p>
            )}
          </div>

          {/* Find Friends Widget */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Find Friends</h3>
            
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={handleSearchUsers}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 mb-4"
            />

            {searchResults.length > 0 ? (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase">Search Results</p>
                {searchResults.map(u => {
                  const isAlreadyFriend = friendsList.some((f: any) => f.uid === u.uid);
                  return (
                    <div key={u.uid} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={u.photo || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} className="w-8 h-8 rounded-full border border-gray-100" alt="" />
                        <span className="text-sm font-medium text-gray-800 truncate w-24">{u.name}</span>
                      </div>
                      {isAlreadyFriend ? (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-medium">Friend</span>
                      ) : (
                        <button 
                          onClick={() => handleAddRealFriend(u.uid)}
                          className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100 transition"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : searchQuery.length >= 2 ? (
              <p className="text-sm text-gray-500">No users found.</p>
            ) : (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Suggested for you</p>
                {suggestedUsers.length > 0 ? (
                  <div className="space-y-4">
                    {suggestedUsers.map(u => (
                      <div key={u.uid} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={u.photo || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} className="w-8 h-8 rounded-full border border-gray-100" alt="" />
                          <span className="text-sm font-medium text-gray-800 truncate w-24">{u.name}</span>
                        </div>
                        <button 
                          onClick={() => handleAddRealFriend(u.uid)}
                          className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100 transition"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No new users to suggest right now.</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Feed */}
        <div className="md:col-span-2 space-y-6">
          {/* Create Post Box */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex gap-4 mb-4">
              <img src={user.photo || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} className="w-10 h-10 rounded-full" alt="avatar" />
              <textarea 
                placeholder="What's on your mind? (Use #hashtags)"
                className="w-full bg-gray-50 rounded-xl p-3 outline-none resize-none placeholder-gray-400 focus:ring-2 focus:ring-blue-100 border border-transparent focus:border-blue-300 transition"
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>

            {mediaUrl && (
              <div className="relative mb-4 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 inline-block w-full text-center">
                <button onClick={() => { setMediaUrl(""); setMediaType("none"); }} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100 text-gray-600">✕</button>
                {mediaType === 'image' ? (
                  <img src={mediaUrl} alt="upload" className="max-h-64 object-contain mx-auto" />
                ) : (
                  <video src={mediaUrl} controls className="max-h-64 mx-auto" />
                )}
              </div>
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
                <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex gap-2">
                <label className="cursor-pointer p-2 text-gray-500 hover:bg-gray-50 rounded-lg hover:text-blue-500 transition flex items-center gap-1">
                  <ImageIcon size={20} /> <span className="text-sm font-medium hidden sm:block">Photo</span>
                  <input type="file" hidden accept="image/*" onChange={(e) => handleMediaUpload(e, 'image')} />
                </label>
                <label className="cursor-pointer p-2 text-gray-500 hover:bg-gray-50 rounded-lg hover:text-green-500 transition flex items-center gap-1">
                  <Video size={20} /> <span className="text-sm font-medium hidden sm:block">Video</span>
                  <input type="file" hidden accept="video/*" onChange={(e) => handleMediaUpload(e, 'video')} />
                </label>
              </div>

              <button 
                onClick={handleCreatePost}
                disabled={isPosting || friendCount === 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isPosting ? "Posting..." : <><Send size={16} /> Post</>}
              </button>
            </div>
          </div>

          {/* Posts Feed */}
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-24 bg-gray-200 rounded-xl mb-4"></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800">No posts yet</h3>
              <p className="text-gray-500 text-sm">Be the first to share something with the community!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <img src={post.userPhoto || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} className="w-12 h-12 rounded-full border border-gray-100" alt="" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-800 leading-tight">{post.userName}</h4>
                          {post.userUid !== user.uid && !friendsList.some((f: any) => f.uid === post.userUid) && (
                            <button 
                              onClick={() => handleAddRealFriend(post.userUid)}
                              className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-medium hover:bg-blue-100 transition"
                            >
                              Add Friend
                            </button>
                          )}
                          {post.userUid !== user.uid && friendsList.some((f: any) => f.uid === post.userUid) && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-medium">
                              Friend
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    {post.userUid === user.uid && (
                      <button onClick={() => deletePost(post._id)} className="text-gray-400 hover:text-red-500 transition p-2">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  {post.caption && (
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap flex flex-col">
                      {post.caption}
                      {post.hashtags?.length > 0 && (
                        <span className="text-blue-500 text-sm mt-2 font-medium">
                          {post.hashtags.join(" ")}
                        </span>
                      )}
                    </p>
                  )}

                  {post.mediaUrl && post.mediaType !== 'none' && (
                    <div className="rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-4">
                      {post.mediaType === 'image' ? (
                        <img src={post.mediaUrl} alt="post media" className="w-full max-h-[500px] object-contain" />
                      ) : (
                        <video src={post.mediaUrl} controls className="w-full max-h-[500px]" />
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-6 border-t border-gray-100 pt-4 mt-4">
                    <button 
                      onClick={() => likePost(post._id)}
                      className={`flex items-center gap-2 transition font-medium text-sm ${post.likes?.includes(user?.uid) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                    >
                      <Heart size={20} fill={post.likes?.includes(user?.uid) ? "currentColor" : "none"} /> 
                      {post.likes?.length || 0}
                    </button>
                    <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition font-medium text-sm">
                      <MessageCircle size={20} /> {post.comments?.length || 0}
                    </button>
                    <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition font-medium text-sm">
                      <Share2 size={20} /> {post.shares || 0}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
