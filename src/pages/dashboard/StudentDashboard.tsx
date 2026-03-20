import React, { useEffect, useState } from 'react';
import { useAuth, handleFirestoreError, OperationType } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, orderBy } from 'firebase/firestore';
import { Score, BehaviorCard } from '../../types';
import { Card } from '../../components/ui/Card';
import { 
  Trophy, 
  BookOpen, 
  Clock, 
  Heart, 
  Zap, 
  Dribbble,
  AlertCircle,
  CheckCircle2,
  Star,
  TrendingUp
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function StudentDashboard() {
  const { profile } = useAuth();
  const [score, setScore] = useState<Score | null>(null);
  const [cards, setCards] = useState<BehaviorCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    // Real-time scores
    const scoreRef = doc(db, 'scores', profile.id);
    const unsubScore = onSnapshot(scoreRef, (docSnap) => {
      if (docSnap.exists()) {
        setScore({ id: docSnap.id, ...docSnap.data() } as Score);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `scores/${profile.id}`);
    });

    // Real-time behavior cards
    const cardsQuery = query(
      collection(db, 'behavior_cards'),
      where('student_id', '==', profile.id),
      orderBy('created_at', 'desc')
    );
    const unsubCards = onSnapshot(cardsQuery, (snapshot) => {
      setCards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BehaviorCard[]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'behavior_cards');
      setLoading(false);
    });

    return () => {
      unsubScore();
      unsubCards();
    };
  }, [profile]);

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-black" />
    </div>
  );

  const metrics = [
    { name: 'Academics', value: score?.academics || 0, max: 350, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Attendance', value: score?.attendance || 0, max: 200, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Behavior', value: score?.behavior || 0, max: 200, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-100' },
    { name: 'Internal', value: score?.internal || 0, max: 150, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100' },
    { name: 'Sports', value: score?.sports || 0, max: 100, icon: Dribbble, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  const totalScore = score?.total || 0;
  const percentage = (totalScore / 1000) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="border-b-4 border-black pb-6">
        <h1 className="text-4xl font-black text-zinc-900 uppercase italic tracking-tighter">
          Yo, {profile?.full_name.split(' ')[0]}!
        </h1>
        <p className="text-lg font-bold text-zinc-600">Check out your stats for this semester. Keep crushing it!</p>
      </header>

      {/* Main Score Card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Card className="relative overflow-hidden bg-primary p-6 sm:p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="relative z-10 flex flex-col items-center justify-between gap-8 sm:flex-row">
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-2 text-black font-black uppercase tracking-widest mb-2">
                <Trophy size={20} />
                <span>Current STPS Score</span>
              </div>
              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                <span className="text-8xl font-black tracking-tighter text-black italic">{totalScore}</span>
                <span className="text-3xl font-black text-black/40">/ 1000</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6 bg-white border-4 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="h-24 w-24 sm:h-32 sm:w-32 relative">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18" cy="18" r="16"
                    className="stroke-black/10"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="18" cy="18" r="16"
                    className="stroke-black transition-all duration-1000 ease-out"
                    strokeWidth="4"
                    strokeDasharray={`${percentage}, 100`}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black italic">{Math.round(percentage)}%</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black uppercase tracking-widest text-black/60">Overall Rank</p>
                <p className="text-4xl font-black italic text-black">#12</p>
                <div className="mt-2 flex items-center justify-end gap-1 text-emerald-600 font-bold">
                  <TrendingUp size={16} />
                  <span>+5 spots</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Brutalist Accents */}
          <div className="absolute top-4 right-4 h-12 w-12 border-4 border-black rotate-12 opacity-20" />
          <div className="absolute bottom-4 left-4 h-8 w-8 bg-black rotate-45 opacity-10" />
        </Card>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <Card className="flex flex-col items-center p-6 text-center h-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-primary transition-colors">
              <div className={cn('mb-4 rounded-full border-2 border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]', metric.bg, metric.color)}>
                <metric.icon size={28} />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500">{metric.name}</p>
              <p className="mt-2 text-3xl font-black text-zinc-900 italic">{metric.value}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">max {metric.max}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Behavior Cards */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-3xl font-black text-zinc-900 uppercase italic tracking-tighter">Recent Behavior Cards</h2>
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {cards.length > 0 ? (
                cards.map((card) => (
                  <motion.div
                    key={card.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <Card className="flex items-center gap-4 p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                        card.type === 'GREEN' ? 'bg-emerald-400 text-black' :
                        card.type === 'BLUE' ? 'bg-sky-400 text-black' :
                        'bg-rose-400 text-black'
                      )}>
                        {card.type === 'RED' ? <AlertCircle size={24} /> : 
                         card.type === 'BLUE' ? <Star size={24} /> : 
                         <CheckCircle2 size={24} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-black text-zinc-900">{card.reason}</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                          {card.type} Card • {new Date(card.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={cn(
                        'text-2xl font-black italic',
                        card.type === 'GREEN' ? 'text-emerald-600' :
                        card.type === 'BLUE' ? 'text-sky-600' :
                        'text-rose-600'
                      )}>
                        {card.type === 'GREEN' ? '+45' : card.type === 'BLUE' ? '+20' : '-70'}
                      </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <p className="text-lg font-bold text-zinc-400 italic">No behavior cards assigned yet. Stay good!</p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick Actions / Info */}
        <div className="space-y-6">
          <Card title="Pro Tips" className="border-2 border-black bg-white">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black bg-primary text-black">
                  <CheckCircle2 size={14} />
                </div>
                <p className="text-sm font-bold text-zinc-600">Keep your attendance above <span className="text-black font-black">75%</span> to maximize points.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black bg-rose-400 text-black">
                  <AlertCircle size={14} />
                </div>
                <p className="text-sm font-bold text-zinc-600"><span className="text-black font-black">3 Red Cards</span> in a month will result in automatic suspension.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black bg-sky-400 text-black">
                  <Star size={14} />
                </div>
                <p className="text-sm font-bold text-zinc-600">Participate in <span className="text-black font-black">Community</span> to earn bonus points!</p>
              </div>
            </div>
          </Card>

          <Card className="border-2 border-black bg-black text-white p-6">
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">Need Help?</h3>
            <p className="text-sm font-bold text-zinc-400 mb-4">Contact your class teacher or the school administration.</p>
            <button className="w-full rounded-xl border-2 border-white bg-white py-2 text-sm font-black uppercase tracking-widest text-black hover:bg-primary transition-colors">
              Support Chat
            </button>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
