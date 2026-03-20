import React, { useState, useEffect } from 'react';
import { useAuth, handleFirestoreError, OperationType } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, setDoc, doc, updateDoc, onSnapshot, orderBy, getDoc } from 'firebase/firestore';
import { CommunityPost, Class, PollVote, Profile, College } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MessageSquare, Send, Filter, Vote, Plus, X, BarChart2, Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export function Community() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [activeCollegeId, setActiveCollegeId] = useState<string>('');

  // Sync activeCollegeId with profile.college_id for non-super-admins
  useEffect(() => {
    if (profile?.college_id && !activeCollegeId) {
      setActiveCollegeId(profile.college_id);
    }
  }, [profile?.college_id, activeCollegeId]);
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [newPost, setNewPost] = useState('');
  const [isPoll, setIsPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const isSuperAdmin = profile?.role === 'SUPER_ADMIN';
  const isStaff = profile?.role !== 'STUDENT';

  // For Super Admins, fetch all colleges to select from
  useEffect(() => {
    if (isSuperAdmin) {
      const q = query(collection(db, 'colleges'), orderBy('name', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const collegeList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as College[];
        setColleges(collegeList);
        // If no college is selected, default to the first one
        if (collegeList.length > 0 && !activeCollegeId) {
          setActiveCollegeId(collegeList[0].id);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'colleges');
      });
      return () => unsubscribe();
    }
  }, [isSuperAdmin, activeCollegeId]);

  useEffect(() => {
    if (!activeCollegeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Fetch classes
    const classesQuery = query(collection(db, 'classes'), where('college_id', '==', activeCollegeId));
    getDocs(classesQuery).then(snapshot => {
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Class[]);
    });

    // Real-time votes
    const votesRef = collection(db, 'poll_votes');
    const unsubVotes = onSnapshot(votesRef, (snapshot) => {
      setVotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PollVote[]);
    });

    // Real-time posts
    let postsQuery = query(
      collection(db, 'community_posts'),
      where('college_id', '==', activeCollegeId),
      orderBy('created_at', 'desc')
    );

    if (selectedClass !== 'ALL') {
      postsQuery = query(postsQuery, where('class_id', '==', selectedClass));
    }

    const unsubPosts = onSnapshot(postsQuery, async (snapshot) => {
      const postList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommunityPost[];

      // Fetch author details for each post (manual join)
      const postsWithAuthors = await Promise.all(postList.map(async (post) => {
        const authorDoc = await getDoc(doc(db, 'profiles', post.author_id));
        if (authorDoc.exists()) {
          const authorData = authorDoc.data() as Profile;
          return {
            ...post,
            author: {
              full_name: authorData.full_name,
              role: authorData.role
            }
          };
        }
        return post;
      }));

      setPosts(postsWithAuthors);
      setLoading(false);
    }, (error) => {
      console.error('Posts fetch error:', error);
      setLoading(false);
    });

    return () => {
      unsubVotes();
      unsubPosts();
    };
  }, [activeCollegeId, selectedClass]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !profile || !activeCollegeId) {
      if (!activeCollegeId) toast.error('Please select a college first');
      return;
    }

    if (isPoll && pollOptions.some(opt => !opt.trim())) {
      toast.error('Please fill in all poll options');
      return;
    }

    setPosting(true);
    try {
      const postId = Math.random().toString(36).substring(2, 15);
      const postData: CommunityPost = {
        id: postId,
        author_id: profile.id,
        college_id: activeCollegeId || '',
        class_id: selectedClass === 'ALL' ? undefined : selectedClass,
        content: newPost,
        is_poll: isPoll,
        poll_options: isPoll ? pollOptions.filter(opt => opt.trim()) : undefined,
        created_at: new Date().toISOString(),
      };

      await setDoc(doc(db, 'community_posts', postId), postData);
      toast.success(isPoll ? 'Poll launched successfully!' : 'Announcement posted successfully!');
      setNewPost('');
      setIsPoll(false);
      setPollOptions(['', '']);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'community_posts');
    } finally {
      setPosting(false);
    }
  };

  const handleVote = async (postId: string, optionIndex: number) => {
    if (!profile) return;
    try {
      const existingVote = votes.find(v => v.post_id === postId && v.user_id === profile.id);
      
      if (existingVote) {
        if (existingVote.option_index === optionIndex) return;
        await updateDoc(doc(db, 'poll_votes', existingVote.id), { option_index: optionIndex });
      } else {
        const voteId = Math.random().toString(36).substring(2, 15);
        const newVote: PollVote = {
          id: voteId,
          post_id: postId,
          user_id: profile.id,
          option_index: optionIndex,
          created_at: new Date().toISOString(),
        };
        await setDoc(doc(db, 'poll_votes', voteId), newVote);
      }
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'poll_votes');
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

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-black" />
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b-4 border-black pb-6">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 uppercase italic tracking-tighter">Community Hub</h1>
          <p className="text-lg font-bold text-zinc-600">Connect with your college through polls and announcements.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isSuperAdmin && (
            <div className="flex items-center gap-3">
              <Building2 size={20} className="text-black" />
              <select
                className="rounded-xl border-2 border-black bg-white px-4 py-2 text-sm font-black uppercase tracking-widest focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                value={activeCollegeId}
                onChange={(e) => {
                  setActiveCollegeId(e.target.value);
                  setSelectedClass('ALL');
                }}
              >
                {colleges.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Filter size={20} className="text-black" />
            <select
              className="rounded-xl border-2 border-black bg-white px-4 py-2 text-sm font-black uppercase tracking-widest focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="ALL">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Post Creation (Staff Only) */}
        <div className="lg:col-span-2 space-y-6">
          {isStaff && (
            <Card className="border-2 border-black bg-primary">
              <form onSubmit={handleCreatePost} className="space-y-4">
                <textarea
                  className="w-full rounded-xl border-2 border-black bg-white p-4 text-sm font-bold focus:outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  placeholder={isPoll ? "Ask a question..." : "Post an announcement..."}
                  rows={3}
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                />
                
                {isPoll && (
                  <div className="space-y-3">
                    <p className="text-xs font-black text-black uppercase tracking-widest">Poll Options</p>
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
                            variant="danger" 
                            size="sm" 
                            onClick={() => removeOption(index)}
                          >
                            <X size={18} />
                          </Button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 5 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addOption}
                        className="bg-white"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Option
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between border-t-2 border-black pt-4">
                  <button
                    type="button"
                    onClick={() => setIsPoll(!isPoll)}
                    className={cn(
                      'flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-all',
                      isPoll ? 'text-black underline decoration-4 underline-offset-4' : 'text-zinc-700 hover:text-black'
                    )}
                  >
                    <Vote size={20} />
                    {isPoll ? 'Announcement' : 'Create Poll'}
                  </button>
                  <Button type="submit" variant="primary" disabled={posting}>
                    {posting ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Send size={18} className="mr-2" />
                        {isPoll ? 'Launch' : 'Post'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Posts Feed */}
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {posts.length > 0 ? (
                posts.map((post) => {
                  const totalVotes = getTotalVotes(post.id);
                  const userVote = votes.find(v => v.post_id === post.id && v.user_id === profile?.id);

                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                    >
                      <Card className="p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-primary text-black font-black">
                              {post.is_poll ? <Vote size={24} /> : <MessageSquare size={24} />}
                            </div>
                            <div>
                              <p className="text-lg font-black text-zinc-900 uppercase tracking-tight">
                                {post.is_poll ? 'Community Poll' : 'Announcement'}
                              </p>
                              <div className="flex items-center gap-2 text-sm font-bold text-zinc-500">
                                <span className="text-black">{post.author?.full_name || 'Staff Member'}</span>
                                <span className="rounded-lg border border-black bg-zinc-100 px-2 py-0.5 text-[10px] uppercase font-black tracking-widest">
                                  {post.author?.role?.toLowerCase().replace('_', ' ') || 'Staff'}
                                </span>
                                <span>•</span>
                                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          {post.class_id && (
                            <span className="rounded-lg border-2 border-black bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black">
                              {classes.find(c => c.id === post.class_id)?.name || 'Class Specific'}
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-6 text-lg leading-relaxed text-zinc-800 font-bold">
                          {post.content}
                        </div>

                        {post.is_poll && post.poll_options && (
                          <div className="mt-8 space-y-4">
                            {post.poll_options.map((option, index) => {
                              const count = getVoteCount(post.id, index);
                              const percent = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                              const isSelected = userVote?.option_index === index;

                              return (
                                <div key={index} className="space-y-1">
                                  <button
                                    onClick={() => handleVote(post.id, index)}
                                    className={cn(
                                      "relative w-full overflow-hidden rounded-xl border-2 border-black p-4 text-left transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                                      isSelected 
                                        ? "bg-primary" 
                                        : "bg-white hover:bg-zinc-50"
                                    )}
                                  >
                                    <div className="relative z-10 flex items-center justify-between">
                                      <span className="text-base font-black uppercase tracking-tight">
                                        {option}
                                      </span>
                                      {totalVotes > 0 && (
                                        <span className="text-sm font-black">
                                          {percent.toFixed(0)}%
                                        </span>
                                      )}
                                    </div>
                                    {totalVotes > 0 && (
                                      <div 
                                        className={cn(
                                          "absolute inset-y-0 left-0 transition-all duration-500",
                                          isSelected ? "bg-black/10" : "bg-primary/20"
                                        )}
                                        style={{ width: `${percent}%` }}
                                      />
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                            <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-zinc-500 px-1">
                              <div className="flex items-center gap-2">
                                <BarChart2 size={14} className="text-black" />
                                {totalVotes} total votes
                              </div>
                              {userVote && <span className="text-black underline decoration-2 underline-offset-2">You voted</span>}
                            </div>
                          </div>
                        )}

                        {!post.is_poll && (
                          <div className="mt-8 flex items-center gap-6 border-t-2 border-black pt-4">
                            <button className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-600 hover:text-black">
                              <MessageSquare size={18} />
                              Comment
                            </button>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center border-4 border-dashed border-zinc-200 rounded-3xl">
                  <Vote size={64} className="mb-4 text-zinc-200" />
                  <p className="text-xl font-black text-zinc-400 uppercase italic">No polls or announcements yet.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card title="Community Guidelines" className="border-2 border-black bg-white">
            <ul className="space-y-4 text-sm font-bold text-zinc-600">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black bg-primary text-[10px] font-black">1</span>
                Only Staff can create polls or post announcements.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black bg-emerald-400 text-[10px] font-black">2</span>
                Students can participate by voting in polls.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black bg-sky-400 text-[10px] font-black">3</span>
                Keep the discussion professional and respectful.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black bg-rose-400 text-[10px] font-black">4</span>
                Polls are used for college-wide feedback.
              </li>
            </ul>
          </Card>

          <Card title="Poll Statistics" className="border-2 border-black bg-primary">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <span className="text-sm font-black uppercase tracking-widest text-black/60">Active Polls</span>
                <span className="text-xl font-black text-black">{posts.filter(p => p.is_poll).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-black uppercase tracking-widest text-black/60">Total Participation</span>
                <span className="text-xl font-black text-black">{votes.length} votes</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
