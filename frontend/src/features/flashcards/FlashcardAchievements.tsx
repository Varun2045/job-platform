import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Trophy, Star, ArrowLeft, Brain, Search } from 'lucide-react';

interface Flashcard {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  answer: string;
  userAnswer?: number | null;
  masteryStatus: 'unstudied' | 'needs_practice' | 'mastered';
  difficulty: 'easy' | 'medium' | 'hard' | 'super_hard';
}

interface FlashcardDeck {
  id: string;
  title: string;
  description: string;
  category: string;
  cards: Flashcard[];
  updatedAt: string;
}

interface TopicMastery {
  topic: string;
  category: string;
  easyCleared: boolean;
  mediumCleared: boolean;
  hardCleared: boolean;
  superHardCleared: boolean;
  totalStars: number;
}

export const FlashcardAchievements: React.FC = () => {
  const navigate = useNavigate();

  // Filter States
  const [topicSearch, setTopicSearch] = useState('');
  const [starsFilter, setStarsFilter] = useState('All');

  // Fetch Saved Decks
  const { data: decks = [], isLoading } = useQuery<FlashcardDeck[]>({
    queryKey: ['flashcards'],
    queryFn: async () => {
      const res = await fetch('/api/flashcards');
      if (!res.ok) throw new Error('Failed to load flashcard decks');
      return res.json();
    }
  });

  // Calculate achievements per topic
  const topicMasteryList = useMemo((): TopicMastery[] => {
    const masteryMap = new Map<string, { category: string; decks: FlashcardDeck[] }>();

    // Group decks by title/topic (case insensitive / trimmed)
    decks.forEach(deck => {
      const topicName = deck.title.trim();
      const existing = masteryMap.get(topicName) || { category: deck.category, decks: [] };
      existing.decks.push(deck);
      masteryMap.set(topicName, existing);
    });

    const list: TopicMastery[] = [];

    masteryMap.forEach((val, topic) => {
      // Helper function to check if a deck of specific difficulty is cleared
      // A deck is cleared if it exists and ALL its cards are 'mastered'
      const checkCleared = (difficulty: 'easy' | 'medium' | 'hard' | 'super_hard'): boolean => {
        const deck = val.decks.find(d => d.cards.length > 0 && d.cards.every(c => c.difficulty === difficulty));
        if (!deck) return false;
        return deck.cards.every(c => c.masteryStatus === 'mastered');
      };

      const easyCleared = checkCleared('easy');
      const mediumCleared = checkCleared('medium');
      const hardCleared = checkCleared('hard');
      const superHardCleared = checkCleared('super_hard');

      // Calculate stars earned: Easy = 1, Medium = 2, Hard = 3, Super Hard = 4
      let totalStars = 0;
      if (easyCleared) totalStars += 1;
      if (mediumCleared) totalStars += 2;
      if (hardCleared) totalStars += 3;
      if (superHardCleared) totalStars += 4;

      list.push({
        topic,
        category: val.category,
        easyCleared,
        mediumCleared,
        hardCleared,
        superHardCleared,
        totalStars
      });
    });

    return list.sort((a, b) => b.totalStars - a.totalStars);
  }, [decks]);

  // Filtered List based on Topic search & Stars filter
  const filteredTopicMasteryList = useMemo(() => {
    return topicMasteryList.filter(tm => {
      const matchesTopic = tm.topic.toLowerCase().includes(topicSearch.toLowerCase());
      
      let matchesStars = true;
      if (starsFilter !== 'All') {
        if (starsFilter === 'easy') matchesStars = tm.easyCleared;
        else if (starsFilter === 'medium') matchesStars = tm.mediumCleared;
        else if (starsFilter === 'hard') matchesStars = tm.hardCleared;
        else if (starsFilter === 'super_hard') matchesStars = tm.superHardCleared;
      }
      
      return matchesTopic && matchesStars;
    });
  }, [topicMasteryList, topicSearch, starsFilter]);

  // Overall Statistics
  const overallStats = useMemo(() => {
    const totalStars = topicMasteryList.reduce((acc, t) => acc + t.totalStars, 0);
    const totalPossibleStars = topicMasteryList.length * 10; // 1+2+3+4 = 10 stars possible per topic

    let rankName = 'Novice Study Partner';
    let nextRankThreshold = 10;
    let rankGlow = 'from-blue-500 to-indigo-500';

    if (totalStars >= 1000) {
      rankName = 'Sage of Technology';
      nextRankThreshold = 1000;
      rankGlow = 'from-pink-500 via-red-500 to-yellow-500 animate-pulse';
    } else if (totalStars >= 900) {
      rankName = 'Mythic Scholar';
      nextRankThreshold = 1000;
      rankGlow = 'from-purple-600 via-pink-500 to-red-500';
    } else if (totalStars >= 800) {
      rankName = 'Legendary Scholar';
      nextRankThreshold = 900;
      rankGlow = 'from-indigo-500 via-purple-500 to-pink-500';
    } else if (totalStars >= 700) {
      rankName = 'Grandmaster of Tech';
      nextRankThreshold = 800;
      rankGlow = 'from-teal-400 via-cyan-500 to-indigo-500';
    } else if (totalStars >= 600) {
      rankName = 'Master of Tech';
      nextRankThreshold = 700;
      rankGlow = 'from-emerald-400 to-teal-500';
    } else if (totalStars >= 500) {
      rankName = 'Fellow Scholar';
      nextRankThreshold = 600;
      rankGlow = 'from-green-400 to-emerald-500';
    } else if (totalStars >= 400) {
      rankName = 'Distinguished Scholar';
      nextRankThreshold = 500;
      rankGlow = 'from-yellow-400 to-orange-500';
    } else if (totalStars >= 300) {
      rankName = 'Principal Scholar';
      nextRankThreshold = 400;
      rankGlow = 'from-orange-500 to-red-500';
    } else if (totalStars >= 200) {
      rankName = 'Tech Lead Scholar';
      nextRankThreshold = 300;
      rankGlow = 'from-purple-500 to-indigo-500';
    } else if (totalStars >= 100) {
      rankName = 'Senior Developer Scholar';
      nextRankThreshold = 200;
      rankGlow = 'from-indigo-400 to-purple-500';
    } else if (totalStars >= 50) {
      rankName = 'Software Engineer Scholar';
      nextRankThreshold = 100;
      rankGlow = 'from-blue-400 to-indigo-500';
    } else if (totalStars >= 10) {
      rankName = 'Apprentice Coder';
      nextRankThreshold = 50;
      rankGlow = 'from-cyan-500 to-blue-500';
    }

    const rankProgress = nextRankThreshold > 0 ? Math.min(100, Math.round((totalStars / nextRankThreshold) * 100)) : 100;

    return {
      totalStars,
      totalPossibleStars,
      rankName,
      rankGlow,
      rankProgress,
      nextRankThreshold
    };
  }, [topicMasteryList]);

  // Helper to render star array
  const renderStars = (count: number) => {
    return Array.from({ length: count }).map((_, i) => (
      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
    ));
  };

  const renderLockedStars = (count: number) => {
    return Array.from({ length: count }).map((_, i) => (
      <Star key={i} className="w-4 h-4 text-[#232d3f] fill-[#1b2535] shrink-0" />
    ));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen flex flex-col text-white pb-16">
      
      {/* Header controls */}
      <div className="shrink-0 flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/flashcards')}
          className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Flashcards
        </button>

        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="w-6 h-6 text-indigo-400" /> Topic Mastery
        </h1>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500 italic animate-pulse">Calculating mastery stats...</p>
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center py-20 bg-[#131a26] border border-[#232d3f] rounded-3xl p-8 space-y-4">
          <Trophy className="w-20 h-20 text-indigo-400/10 mx-auto" />
          <h3 className="text-lg font-bold">No Study Stats Recorded</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Clear all MCQ questions of an Easy, Medium, Hard, or Super Hard deck to earn study stars. Clear more difficulty levels to level up your achievements rank!
          </p>
          <button
            onClick={() => navigate('/flashcards')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
          >
            Go to Flashcards
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Summary Progress Card */}
          <div className="bg-[#131a26] border border-[#232d3f] rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl" />
            
            {/* Rank Icon Badge */}
            <div className="shrink-0 w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-[#232d3f] flex items-center justify-center relative">
              <Trophy className="w-12 h-12 text-indigo-400" />
            </div>

            {/* Rank Details */}
            <div className="flex-grow space-y-3 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">Active Rank Status</span>
                  <h2 className={`text-xl font-black bg-gradient-to-r ${overallStats.rankGlow} bg-clip-text text-transparent`}>
                    {overallStats.rankName}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 block">Total Stars Awarded</span>
                  <span className="text-lg font-black text-white flex items-center gap-1 md:justify-end">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {overallStats.totalStars} Stars
                  </span>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                  <span>Progress to next Rank Milestone</span>
                  <span>{overallStats.totalStars} / {overallStats.nextRankThreshold} Stars ({overallStats.rankProgress}%)</span>
                </div>
                <div className="w-full bg-[#1b2535] h-2.5 rounded-full overflow-hidden border border-[#232d3f]">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${overallStats.rankProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Achievements Grid per Topic */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider">Mastery Achievements by Topic</h3>
              
              {/* Filter controls bar */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Input */}
                <div className="relative w-full sm:w-48 shrink-0">
                  <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search topics..."
                    value={topicSearch}
                    onChange={e => setTopicSearch(e.target.value)}
                    className="w-full bg-[#131a26] border border-[#232d3f] rounded-xl py-1 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition placeholder-gray-500"
                  />
                </div>

                {/* Stars Filter select dropdown */}
                <div className="flex items-center gap-1.5 bg-[#131a26] border border-[#232d3f] rounded-xl px-3 py-1 text-xs text-[#94a3b8]">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <select
                    value={starsFilter}
                    onChange={e => setStarsFilter(e.target.value)}
                    className="bg-transparent text-white focus:outline-none cursor-pointer text-center"
                    style={{ textAlignLast: 'center' }}
                  >
                    <option value="All" className="bg-[#131a26]">All</option>
                    <option value="easy" className="bg-[#131a26]">Easy</option>
                    <option value="medium" className="bg-[#131a26]">Medium</option>
                    <option value="hard" className="bg-[#131a26]">Hard</option>
                    <option value="super_hard" className="bg-[#131a26]">Super Hard</option>
                  </select>
                </div>
              </div>
            </div>
            
            {filteredTopicMasteryList.length === 0 ? (
              <div className="text-center py-12 bg-[#131a26]/30 border border-[#232d3f]/40 rounded-2xl p-6">
                <p className="text-xs text-gray-500 italic">No topics match the active achievements filter criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                {filteredTopicMasteryList.map((tm, idx) => (
                <div 
                  key={idx}
                  className="bg-[#131a26] border border-[#232d3f] hover:border-[#1b2535] rounded-2xl p-4 space-y-3.5 flex flex-col justify-between transition-all duration-200"
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] font-black uppercase bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md">
                        {tm.category}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {tm.totalStars} / 10 Stars
                      </span>
                    </div>

                    <h4 className="font-extrabold text-white text-sm truncate">
                      {tm.topic}
                    </h4>
                  </div>

                  {/* Star Achievements Checklist */}
                  <div className="grid grid-cols-2 gap-2 bg-[#1b2535]/30 p-2 rounded-xl border border-[#232d3f]/50 text-[10.5px]">
                    {/* Easy Level */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#1b2535]/50">
                      <span className="text-gray-500 font-bold">Easy</span>
                      <div className="flex items-center gap-1">
                        {tm.easyCleared ? renderStars(1) : renderLockedStars(1)}
                      </div>
                    </div>

                    {/* Medium Level */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#1b2535]/50">
                      <span className="text-gray-500 font-bold">Medium</span>
                      <div className="flex items-center gap-1">
                        {tm.mediumCleared ? renderStars(2) : renderLockedStars(2)}
                      </div>
                    </div>

                    {/* Hard Level */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#1b2535]/50">
                      <span className="text-gray-500 font-bold">Hard</span>
                      <div className="flex items-center gap-1">
                        {tm.hardCleared ? renderStars(3) : renderLockedStars(3)}
                      </div>
                    </div>

                    {/* Super Hard Level */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#1b2535]/50">
                      <span className="text-gray-500 font-bold">Super Hard</span>
                      <div className="flex items-center gap-1">
                        {tm.superHardCleared ? renderStars(4) : renderLockedStars(4)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => navigate('/flashcards')}
                    className="w-full flex items-center justify-center gap-1.5 bg-[#1b2535] hover:bg-[#232d3f] text-[#94a3b8] hover:text-white border border-[#232d3f] py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer"
                  >
                    <Brain className="w-3.5 h-3.5" /> Study Deck Topic
                  </button>
                </div>
              ))}
            </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default FlashcardAchievements;
