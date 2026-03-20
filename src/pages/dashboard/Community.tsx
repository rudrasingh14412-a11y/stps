import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { CommunityPost, Class, PollVote } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MessageSquare, Send, Filter, Vote, Plus, X, BarChart2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Community() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [newPost, setNewPost] = useState('');
  const [isPoll, setIsPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(true);

  const isStaff = profile?.role !== 'STUDENT';

  useEffect(() => {
    fetchData();
  }, [selectedClass]);

  async function fetchData() {
    try {
      let query = supabase
        .from('community_posts')
        .select('*, author:profiles(full_name, role)')
        .order('created_at', { ascending: false });
      
      if (selectedClass !== 'ALL') {
        query = query.eq('class_id', selectedClass);
      }

      const [postsRes, classesRes, votesRes] = await Promise.all([
        query,
        supabase.from('classes').select('*'),
        supabase.from('poll_votes').select('*')
      ]);

      if (postsRes.data) setPosts(postsRes.data);
      if (classesRes.data) setClasses(classesRes.data);
      if (votesRes.data) setVotes(votesRes.data);
    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    if (isPoll && pollOptions.some(opt => !opt.trim())) {
      alert('Please fill all poll options');
      return;
    }

    try {
      const { error } = await supabase.from('community_posts').insert({
        author_id: profile?.id,
        college_id: profile?.college_id,
        class_id: selectedClass === 'ALL' ? null : selectedClass,
        content: newPost,
        is_poll: isPoll,
        poll_options: isPoll ? pollOptions.filter(opt => opt.trim()) : null,
      });

      if (error) throw error;
      setNewPost('');
      setIsPoll(false);
      setPollOptions(['', '']);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to post');
    }
  };

  const handleVote = async (postId: string, optionIndex: number) => {
    try {
      // Check if already voted
      const existingVote = votes.find(v => v.post_id === postId && v.user_id === profile?.id);
      
      if (existingVote) {
        if (existingVote.option_index === optionIndex) return; // Same vote
        
        // Update vote
        const { error } = await supabase
          .from('poll_votes')
          .update({ option_index: optionIndex })
          .eq('id', existingVote.id);
        if (error) throw error;
      } else {
        // New vote
        const { error } = await supabase.from('poll_votes').insert({
          post_id: postId,
          user_id: profile?.id,
          option_index: optionIndex,
        });
        if (error) throw error;
      }
      
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to vote');
    }
  };

  const getVoteCount = (postId: string, optionIndex: number) => {
    return votes.filter(v => v.post_id === postId && v.option_index === optionIndex).length;
  };

  const getTotalVotes = (postId: string) => {
    return votes.filter(v => v.post_id === postId).length;
  };

  const addOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removeOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Community Hub</h1>
          <p className="text-zinc-500">Connect with your college through polls and announcements.</p>
        </div>
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-zinc-400" />
          <select
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="ALL">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Post Creation (Staff Only) */}
        <div className="lg:col-span-2 space-y-6">
          {isStaff && (
            <Card>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <textarea
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={isPoll ? "Ask a question..." : "Post an announcement..."}
                  rows={3}
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                />
                
                {isPoll && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Poll Options</p>
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1"
                        />
                        {pollOptions.length > 2 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeOption(index)}
                            className="text-zinc-400 hover:text-red-500"
                          >
                            <X size={18} />
                          </Button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 5 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={addOption}
                        className="text-indigo-600"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Option
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsPoll(!isPoll)}
                    className={cn(
                      'flex items-center gap-2 text-sm font-medium transition-colors',
                      isPoll ? 'text-indigo-600' : 'text-zinc-500 hover:text-zinc-900'
                    )}
                  >
                    <Vote size={18} />
                    {isPoll ? 'Switch to Announcement' : 'Create as Poll'}
                  </button>
                  <Button type="submit">
                    <Send size={18} className="mr-2" />
                    {isPoll ? 'Launch Poll' : 'Post'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Posts Feed */}
          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map((post) => {
                const totalVotes = getTotalVotes(post.id);
                const userVote = votes.find(v => v.post_id === post.id && v.user_id === profile?.id);

                return (
                  <Card key={post.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold">
                          {post.is_poll ? <Vote size={20} /> : <MessageSquare size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">
                            {post.is_poll ? 'Community Poll' : 'Announcement'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span className="font-medium text-zinc-700">{post.author?.full_name || 'Staff Member'}</span>
                            <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                              {post.author?.role?.toLowerCase().replace('_', ' ') || 'Staff'}
                            </span>
                            <span>•</span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      {post.class_id && (
                        <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          {classes.find(c => c.id === post.class_id)?.name || 'Class Specific'}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-4 text-sm leading-relaxed text-zinc-700 font-medium">
                      {post.content}
                    </div>

                    {post.is_poll && post.poll_options && (
                      <div className="mt-6 space-y-3">
                        {post.poll_options.map((option, index) => {
                          const count = getVoteCount(post.id, index);
                          const percent = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                          const isSelected = userVote?.option_index === index;

                          return (
                            <div key={index} className="space-y-1">
                              <button
                                onClick={() => handleVote(post.id, index)}
                                className={cn(
                                  "relative w-full overflow-hidden rounded-xl border p-4 text-left transition-all",
                                  isSelected 
                                    ? "border-indigo-600 bg-indigo-50" 
                                    : "border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50"
                                )}
                              >
                                <div className="relative z-10 flex items-center justify-between">
                                  <span className={cn("text-sm font-medium", isSelected ? "text-indigo-700" : "text-zinc-700")}>
                                    {option}
                                  </span>
                                  {totalVotes > 0 && (
                                    <span className="text-xs font-bold text-zinc-400">
                                      {percent.toFixed(0)}%
                                    </span>
                                  )}
                                </div>
                                {totalVotes > 0 && (
                                  <div 
                                    className={cn(
                                      "absolute inset-y-0 left-0 transition-all duration-500",
                                      isSelected ? "bg-indigo-100" : "bg-zinc-100"
                                    )}
                                    style={{ width: `${percent}%` }}
                                  />
                                )}
                              </button>
                            </div>
                          );
                        })}
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1">
                          <div className="flex items-center gap-1">
                            <BarChart2 size={12} />
                            {totalVotes} total votes
                          </div>
                          {userVote && <span className="text-indigo-600">You voted</span>}
                        </div>
                      </div>
                    )}

                    {!post.is_poll && (
                      <div className="mt-6 flex items-center gap-6 border-t border-zinc-100 pt-4">
                        <button className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-indigo-600">
                          <MessageSquare size={16} />
                          Comment
                        </button>
                      </div>
                    )}
                  </Card>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Vote size={48} className="mb-4 text-zinc-200" />
                <p className="text-zinc-500">No polls or announcements yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card title="Community Guidelines">
            <ul className="space-y-3 text-sm text-zinc-600">
              <li className="flex gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                Only Staff can create polls or post announcements.
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                Students can participate by voting in polls.
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                Keep the discussion professional and respectful.
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                Polls are used for college-wide and class-specific feedback.
              </li>
            </ul>
          </Card>

          <Card title="Poll Statistics">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Active Polls</span>
                <span className="text-sm font-bold text-zinc-900">{posts.filter(p => p.is_poll).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Total Participation</span>
                <span className="text-sm font-bold text-zinc-900">{votes.length} votes</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
