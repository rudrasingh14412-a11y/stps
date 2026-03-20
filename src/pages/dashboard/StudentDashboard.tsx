import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
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
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export function StudentDashboard() {
  const { profile } = useAuth();
  const [score, setScore] = useState<Score | null>(null);
  const [cards, setCards] = useState<BehaviorCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  async function fetchData() {
    try {
      const [scoreRes, cardsRes] = await Promise.all([
        supabase.from('scores').select('*').eq('student_id', profile?.id).single(),
        supabase.from('behavior_cards').select('*').eq('student_id', profile?.id).order('created_at', { ascending: false })
      ]);

      if (scoreRes.data) setScore(scoreRes.data);
      if (cardsRes.data) setCards(cardsRes.data);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  const metrics = [
    { name: 'Academics', value: score?.academics || 0, max: 350, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Attendance', value: score?.attendance || 0, max: 200, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Behavior', value: score?.behavior || 0, max: 200, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
    { name: 'Internal', value: score?.internal || 0, max: 150, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Sports', value: score?.sports || 0, max: 100, icon: Dribbble, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const totalScore = score?.total || 0;
  const percentage = (totalScore / 1000) * 100;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900">Welcome back, {profile?.full_name}!</h1>
        <p className="text-zinc-500">Here's your performance overview for this semester.</p>
      </header>

      {/* Main Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden bg-indigo-600 text-white p-6 sm:p-8">
          <div className="relative z-10 flex flex-col items-center justify-between gap-8 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Current STPS Score</p>
              <div className="mt-2 flex items-baseline justify-center sm:justify-start gap-2">
                <span className="text-6xl font-bold tracking-tight">{totalScore}</span>
                <span className="text-2xl text-indigo-200">/ 1000</span>
              </div>
            </div>
            <div className="flex items-center gap-6 bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <div className="h-20 w-20 sm:h-24 sm:w-24">
                <svg className="h-full w-full" viewBox="0 0 36 36">
                  <path
                    className="stroke-white/20"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="stroke-white transition-all duration-1000 ease-out"
                    strokeWidth="3"
                    strokeDasharray={`${percentage}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{percentage.toFixed(1)}%</p>
                <p className="text-[10px] text-indigo-100 uppercase font-semibold tracking-widest">Overall Progress</p>
              </div>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/5" />
        </Card>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="flex flex-col items-center p-4 text-center h-full">
              <div className={cn('mb-3 rounded-xl p-3', metric.bg, metric.color)}>
                <metric.icon size={24} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{metric.name}</p>
              <p className="mt-1 text-xl font-bold text-zinc-900">{metric.value}</p>
              <p className="text-[10px] text-zinc-400 font-medium">max {metric.max}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Behavior Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900">Recent Behavior Cards</h2>
          <div className="space-y-3">
            {cards.length > 0 ? (
              cards.map((card) => (
                <Card key={card.id} className="flex items-center gap-4 p-4">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    card.type === 'GREEN' ? 'bg-emerald-100 text-emerald-600' :
                    card.type === 'BLUE' ? 'bg-blue-100 text-blue-600' :
                    'bg-red-100 text-red-600'
                  )}>
                    {card.type === 'RED' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900">{card.reason}</p>
                    <p className="text-xs text-zinc-500">
                      {card.type} Card • {new Date(card.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={cn(
                    'text-sm font-bold',
                    card.type === 'GREEN' ? 'text-emerald-600' :
                    card.type === 'BLUE' ? 'text-blue-600' :
                    'text-red-600'
                  )}>
                    {card.type === 'GREEN' ? '+45' : card.type === 'BLUE' ? '+20' : '-70'}
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-sm text-zinc-500 italic">No behavior cards assigned yet.</p>
            )}
          </div>
        </div>

        {/* Quick Actions / Info */}
        <div className="space-y-6">
          <Card title="Quick Info">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full bg-indigo-100 p-1 text-indigo-600">
                  <CheckCircle2 size={14} />
                </div>
                <p className="text-sm text-zinc-600">Keep your attendance above 75% to maximize points.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full bg-indigo-100 p-1 text-indigo-600">
                  <CheckCircle2 size={14} />
                </div>
                <p className="text-sm text-zinc-600">3 Red Cards in a month will result in automatic suspension.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
