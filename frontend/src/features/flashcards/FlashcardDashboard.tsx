import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Brain, Trash2, Award, CheckCircle, AlertCircle, 
  ArrowLeft, ArrowRight, RotateCw, Filter, Search, Sparkles, BookOpen, Clock
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.js';
import { useToast } from '../../context/ToastContext.js';

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
  id?: string;
  title: string;
  description: string;
  category: string;
  cards: Flashcard[];
  updatedAt?: string;
}

export const FlashcardDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast, confirmAction } = useToast();
  
  // Dashboard navigation states
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [isStudyMode, setIsStudyMode] = useState(false);
  
  // AI Generator Form States
  const [generatorTopic, setGeneratorTopic] = useState('');
  const [generatorCount, setGeneratorCount] = useState<number | ''>('');
  const [generatorDifficulty, setGeneratorDifficulty] = useState<'easy' | 'medium' | 'hard' | 'super_hard'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');

  // Filtering / Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [masteryFilter, setMasteryFilter] = useState('All');

  // Study Mode States
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);

  // Fetch Decks
  const { data: decks = [], isLoading } = useQuery<FlashcardDeck[]>({
    queryKey: ['flashcards'],
    queryFn: async () => {
      const res = await fetch('/api/flashcards');
      if (!res.ok) throw new Error('Failed to load flashcard decks');
      return res.json();
    }
  });

  // Save Deck Mutation (saves deck card status updates or new decks)
  const saveMutation = useMutation({
    mutationFn: async (deck: FlashcardDeck) => {
      const res = await fetch('/api/flashcards/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deck)
      });
      if (!res.ok) throw new Error('Failed to save deck');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    }
  });

  // Delete Deck Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/flashcards/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete deck');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      setSelectedDeckId(null);
      setIsStudyMode(false);
      showToast('✓ Deck deleted successfully.', 'success');
    }
  });

  // Get selected deck
  const activeDeck = useMemo(() => {
    return decks.find(d => d.id === selectedDeckId) || null;
  }, [decks, selectedDeckId]);

  // Compute Categories from Decks
  const categories = useMemo(() => {
    const cats = new Set(decks.map(d => d.category));
    return ['All', ...Array.from(cats)];
  }, [decks]);

  // Filtered Decks
  const filteredDecks = useMemo(() => {
    return decks.filter(deck => {
      const matchesSearch = deck.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            deck.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || deck.category === categoryFilter;
      
      const matchesDifficulty = difficultyFilter === 'All' || deck.cards.some(c => c.difficulty === difficultyFilter);
      
      const matchesMastery = masteryFilter === 'All' || (
        masteryFilter === 'Mastered' && deck.cards.every(c => c.masteryStatus === 'mastered')
      ) || (
        masteryFilter === 'Needs Practice' && deck.cards.some(c => c.masteryStatus === 'needs_practice')
      );

      return matchesSearch && matchesCategory && matchesDifficulty && matchesMastery;
    });
  }, [decks, searchQuery, categoryFilter, difficultyFilter, masteryFilter]);

  // Handle Dynamic AI Generation
  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatorTopic.trim()) {
      showToast('⚠ Please enter a topic.', 'warning');
      return;
    }
    if (!generatorCount) {
      showToast('⚠ Please enter a valid card count between 1 and 50.', 'warning');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Connecting to AI Engine...');
    
    try {
      setTimeout(() => setGenerationStep('Formulating MCQ Distractors...'), 1000);
      setTimeout(() => setGenerationStep('Building Detailed Technical Explanations...'), 2500);

      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: generatorTopic,
          count: generatorCount,
          difficulty: generatorDifficulty
        })
      });

      if (!res.ok) throw new Error('Generation request failed');
      const data = await res.json();
      
      if (data.success && Array.isArray(data.cards)) {
        // Save the generated deck
        const newDeck: FlashcardDeck = {
          title: generatorTopic,
          description: `AI-generated study deck focusing on ${generatorTopic} (${generatorDifficulty} level)`,
          category: generatorTopic.length > 12 ? generatorTopic.slice(0, 12) + '...' : generatorTopic,
          cards: data.cards
        };

        const saveRes = await saveMutation.mutateAsync(newDeck);
        if (saveRes.success && saveRes.deck) {
          setSelectedDeckId(saveRes.deck.id);
          setShowGeneratorModal(false);
          setGeneratorTopic('');
          setCurrentCardIndex(0);
          setIsFlipped(false);
          setIsStudyMode(true);
        }
      } else {
        throw new Error(data.error || 'Failed to extract generated cards');
      }
    } catch (err: any) {
      showToast(`✕ AI Generation failed: ${err.message}`, 'error');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Card interaction functions
  const handleSelectOption = (optionIndex: number) => {
    if (!activeDeck) return;
    
    const updatedCards = [...activeDeck.cards];
    const currentCard = updatedCards[currentCardIndex];
    
    // Set user choice
    currentCard.userAnswer = optionIndex;
    
    // Automatically set mastery status on answering
    if (optionIndex === currentCard.correctOptionIndex) {
      currentCard.masteryStatus = 'mastered';
    } else {
      currentCard.masteryStatus = 'needs_practice';
    }

    // Save update to backend
    saveMutation.mutate({
      ...activeDeck,
      cards: updatedCards
    });

    // Auto flip card to reveal explanation
    setIsFlipped(true);
  };

  const updateCardMastery = (status: 'unstudied' | 'needs_practice' | 'mastered') => {
    if (!activeDeck) return;
    
    const updatedCards = [...activeDeck.cards];
    updatedCards[currentCardIndex].masteryStatus = status;

    saveMutation.mutate({
      ...activeDeck,
      cards: updatedCards
    });
  };

  const nextCard = () => {
    if (!activeDeck) return;
    if (currentCardIndex < activeDeck.cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleReattemptDeck = () => {
    if (!activeDeck) return;
    confirmAction({
      title: 'Reset Quiz Progress',
      message: 'Are you sure you want to reset all answers and progress to reattempt this quiz?',
      confirmLabel: 'Reset',
      onConfirm: () => {
        const resetCards = activeDeck.cards.map(c => ({
          ...c,
          userAnswer: null,
          masteryStatus: 'unstudied' as const
        }));
        
        saveMutation.mutate({
          ...activeDeck,
          cards: resetCards
        });

        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
    });
  };

  // Predefined prompt pills
  const topicPills = ['React Hooks', 'Node.js Event Loop', 'TypeScript Generics', 'System Design Caching', 'SQL Indexes', 'Docker Compose', 'AWS S3 Policies'];

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen flex flex-col text-white pb-16">
      
      {/* Header Panel */}
      <PageHeader
        themeKey="flashcards"
        title="AI Study Flashcards"
        description="Generate custom MCQ question decks dynamically using Groq, and master key tech topics."
        icon={Brain}
      >
        <button
          onClick={() => setShowGeneratorModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition duration-300 transform hover:scale-105 shadow-md shadow-indigo-500/10 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" /> AI Generate Decks
        </button>
      </PageHeader>

      {!isStudyMode ? (
        /* ==================== DASHBOARD VIEW ==================== */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-6">
          
          {/* Filtering and Searching Bar */}
          <div className="shrink-0 bg-[#131a26] border border-[#232d3f] rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 md:gap-6">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80 md:shrink-0">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search decks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition placeholder-gray-500"
              />
            </div>

            {/* Filter Section Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-[#1b2535] border border-[#232d3f] rounded-xl px-3 py-1.5 text-xs text-[#94a3b8]">
                <Filter className="w-3.5 h-3.5" />
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer text-center"
                  style={{ textAlignLast: 'center' }}
                >
                  <option value="All" className="bg-[#131a26]">All Categories</option>
                  {categories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c} className="bg-[#131a26]">{c}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div className="flex items-center gap-1.5 bg-[#1b2535] border border-[#232d3f] rounded-xl px-3 py-1.5 text-xs text-[#94a3b8]">
                <Clock className="w-3.5 h-3.5" />
                <select
                  value={difficultyFilter}
                  onChange={e => setDifficultyFilter(e.target.value)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer text-center"
                  style={{ textAlignLast: 'center' }}
                >
                  <option value="All" className="bg-[#131a26]">All Difficulties</option>
                  <option value="Easy" className="bg-[#131a26]">Easy</option>
                  <option value="Medium" className="bg-[#131a26]">Medium</option>
                  <option value="Hard" className="bg-[#131a26]">Hard</option>
                  <option value="Super Hard" className="bg-[#131a26]">Super Hard</option>
                </select>
              </div>

              {/* Completion Filter */}
              <div className="flex items-center gap-1.5 bg-[#1b2535] border border-[#232d3f] rounded-xl px-3 py-1.5 text-xs text-[#94a3b8]">
                <Award className="w-3.5 h-3.5" />
                <select
                  value={masteryFilter}
                  onChange={e => setMasteryFilter(e.target.value)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer text-center"
                  style={{ textAlignLast: 'center' }}
                >
                  <option value="All" className="bg-[#131a26]">All Progress</option>
                  <option value="unstarted" className="bg-[#131a26]">Unstarted</option>
                  <option value="in_progress" className="bg-[#131a26]">In Progress</option>
                  <option value="completed" className="bg-[#131a26]">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid Container */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-44 bg-[#131a26] border border-[#232d3f] rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredDecks.length === 0 ? (
              <div className="text-center py-16 bg-[#131a26] border border-[#232d3f] rounded-2xl p-8 space-y-4">
                <Brain className="w-16 h-16 text-indigo-500/20 mx-auto" />
                <h3 className="text-lg font-bold text-white">No Flashcard Decks Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {decks.length === 0 
                    ? "Welcome! Generate your first deck using AI on any technology or interviewer topic to get started." 
                    : "No decks match the active search query or filter filters."}
                </p>
                <button
                  onClick={() => setShowGeneratorModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition duration-200 cursor-pointer"
                >
                  Create AI Flashcard Deck
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                {filteredDecks.map(deck => {
                  const total = deck.cards.length;
                  const mastered = deck.cards.filter(c => c.masteryStatus === 'mastered').length;
                  const completionRate = total > 0 ? Math.round((mastered / total) * 100) : 0;

                  return (
                    <div 
                      key={deck.id}
                      className="group bg-[#131a26] border border-[#232d3f] hover:border-indigo-500/50 rounded-2xl p-5 flex flex-col justify-between h-48 transition-all duration-300 relative overflow-hidden"
                    >
                      {/* Gradient glow overlay */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/10 transition-all duration-300" />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-full">
                            {deck.category}
                          </span>
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {total} Cards
                          </span>
                        </div>
                        <h3 className="font-extrabold text-white text-base truncate group-hover:text-indigo-300 transition-colors">
                          {deck.title}
                        </h3>
                        <p className="text-xs text-[#94a3b8] line-clamp-2 leading-relaxed">
                          {deck.description}
                        </p>
                      </div>

                      <div className="space-y-3 mt-4">
                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-gray-500">
                            <span>Mastery Rate</span>
                            <span>{completionRate}%</span>
                          </div>
                          <div className="w-full bg-[#1b2535] h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedDeckId(deck.id || null);
                              setCurrentCardIndex(0);
                              setIsFlipped(false);
                              setIsStudyMode(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-[#1b2535] hover:bg-indigo-600 text-[#94a3b8] hover:text-white border border-[#232d3f] hover:border-indigo-500 font-bold py-2 rounded-xl text-xs transition duration-200 cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" /> Start Studying
                          </button>
                          
                          <button
                            onClick={() => deleteMutation.mutate(deck.id || '')}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl cursor-pointer transition duration-200"
                            title="Delete Deck"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ==================== STUDY MODE VIEW ==================== */
        activeDeck && (
          <div className="flex-grow flex flex-col space-y-6">
            
            {/* Top Toolbar controls */}
            <div className="shrink-0 flex items-center justify-between bg-[#131a26] border border-[#232d3f] rounded-2xl p-4">
              <button
                onClick={() => {
                  setIsStudyMode(false);
                  queryClient.invalidateQueries({ queryKey: ['flashcards'] });
                }}
                className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </button>

              <div className="text-center">
                <span className="text-xs font-bold text-white block">{activeDeck.title}</span>
                <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider">
                  Deck Study Loop
                </span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleReattemptDeck}
                  className="flex items-center gap-1.5 bg-[#1b2535] hover:bg-indigo-600 border border-[#232d3f] hover:border-indigo-500 text-[#94a3b8] hover:text-white px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition cursor-pointer"
                  title="Reset all progress and reattempt quiz"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Reattempt Quiz
                </button>
                <div className="text-xs text-indigo-400 font-extrabold">
                  Card {currentCardIndex + 1} of {activeDeck.cards.length}
                </div>
              </div>
            </div>

            {/* Study Progress Bar */}
            <div className="shrink-0 w-full bg-[#131a26] h-1.5 rounded-full overflow-hidden border border-[#232d3f]">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${((currentCardIndex + 1) / activeDeck.cards.length) * 100}%` }}
              />
            </div>

            {/* Main Interactive Flashcard Screen */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 justify-center items-start">
              
              {/* Left Side: Card Container */}
              <div className="flex-1 w-full max-w-xl flex flex-col">
                
                {/* 3D Flipping Animation Card wrapper */}
                <div className="relative cursor-pointer min-h-[340px] w-full" style={{ perspective: '1200px' }}>
                  
                  <div 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="absolute inset-0 w-full h-full duration-700 ease-out transform-gpu"
                    style={{ 
                      transformStyle: 'preserve-3d', 
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
                    }}
                  >
                    {/* CARD FRONT */}
                    <div 
                      className="absolute inset-0 w-full h-full bg-[#131a26] border border-[#232d3f] hover:border-indigo-500/40 rounded-3xl p-6 flex flex-col justify-between select-none shadow-xl"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="space-y-4 flex-1 flex flex-col justify-center text-center">
                        <div className="flex justify-center gap-2">
                          <span className="text-[8px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md">
                            Multiple Choice
                          </span>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            activeDeck.cards[currentCardIndex].difficulty === 'super_hard' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                            activeDeck.cards[currentCardIndex].difficulty === 'hard' ? 'bg-red-500/10 text-red-400' :
                            activeDeck.cards[currentCardIndex].difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-green-500/10 text-green-400'
                          }`}>
                            {activeDeck.cards[currentCardIndex].difficulty === 'super_hard' ? 'super hard' : activeDeck.cards[currentCardIndex].difficulty}
                          </span>
                        </div>
                        
                        <h2 className="text-lg md:text-xl font-extrabold text-white leading-relaxed select-text">
                          {activeDeck.cards[currentCardIndex].question}
                        </h2>
                      </div>

                      <div className="text-center text-[10px] text-gray-500 flex items-center justify-center gap-1.5 mt-4">
                        <RotateCw className="w-3.5 h-3.5 animate-spin-slow" /> Click card to flip and view details
                      </div>
                    </div>

                    {/* CARD BACK */}
                    <div 
                      className="absolute inset-0 w-full h-full bg-[#0e141f] border border-indigo-600/30 rounded-3xl p-6 flex flex-col justify-between overflow-y-auto select-none shadow-2xl"
                      style={{ 
                        backfaceVisibility: 'hidden', 
                        transform: 'rotateY(180deg)' 
                      }}
                    >
                      <div className="space-y-4 select-text">
                        <div className="flex justify-between items-center border-b border-[#232d3f] pb-2">
                          <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                            Correct Explanation
                          </span>
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Option {String.fromCharCode(65 + activeDeck.cards[currentCardIndex].correctOptionIndex)}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-white mb-2">
                          Answer Summary:
                        </div>
                        
                        <div className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap">
                          {activeDeck.cards[currentCardIndex].answer}
                        </div>
                      </div>

                      <div className="text-center text-[10px] text-gray-500 flex items-center justify-center gap-1.5 mt-4 border-t border-[#232d3f] pt-3">
                        <RotateCw className="w-3.5 h-3.5" /> Click anywhere to flip back
                      </div>
                    </div>

                  </div>
                </div>

                {/* Question Navigation Controls */}
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={prevCard}
                    disabled={currentCardIndex === 0}
                    className="flex items-center gap-1 px-3 py-2 bg-[#1b2535] hover:bg-[#232d3f] text-[#94a3b8] hover:text-white rounded-xl text-xs transition border border-[#232d3f] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" /> Previous
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateCardMastery('needs_practice')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                        activeDeck.cards[currentCardIndex].masteryStatus === 'needs_practice'
                          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                          : 'bg-[#1b2535]/50 border-transparent text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      Needs Practice
                    </button>
                    <button
                      onClick={() => updateCardMastery('mastered')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                        activeDeck.cards[currentCardIndex].masteryStatus === 'mastered'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-[#1b2535]/50 border-transparent text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      Mastered
                    </button>
                  </div>

                  <button
                    onClick={nextCard}
                    disabled={currentCardIndex === activeDeck.cards.length - 1}
                    className="flex items-center gap-1 px-3 py-2 bg-[#1b2535] hover:bg-[#232d3f] text-[#94a3b8] hover:text-white rounded-xl text-xs transition border border-[#232d3f] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right Side: Options Selectors */}
              <div className="w-full md:w-[460px] shrink-0 space-y-4">
                <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">Select Answer Option</h4>
                  <p className="text-[10.5px] text-gray-500 leading-normal">
                    Test yourself! Choose an option below. Correct answers automatically update your card progress to Mastered.
                  </p>

                  <div className="space-y-1.5">
                    {activeDeck.cards[currentCardIndex].options.map((opt, optIdx) => {
                      const isSelected = activeDeck.cards[currentCardIndex].userAnswer === optIdx;
                      const isCorrect = activeDeck.cards[currentCardIndex].correctOptionIndex === optIdx;
                      const hasAnswered = activeDeck.cards[currentCardIndex].userAnswer !== undefined && 
                                           activeDeck.cards[currentCardIndex].userAnswer !== null;

                      let btnStyle = "bg-[#1b2535] border-[#232d3f] text-[#94a3b8] hover:text-white hover:border-indigo-500";
                      
                      if (hasAnswered) {
                        if (isCorrect) {
                           btnStyle = "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold";
                        } else if (isSelected) {
                          btnStyle = "bg-red-500/10 border-red-500/40 text-red-400";
                        } else {
                          btnStyle = "bg-[#1b2535]/30 border-[#232d3f]/50 text-gray-600";
                        }
                      } else if (isSelected) {
                        btnStyle = "bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold";
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={hasAnswered}
                          onClick={() => handleSelectOption(optIdx)}
                          className={`w-full text-left p-2.5 rounded-xl border text-[11px] leading-relaxed transition-all duration-200 cursor-pointer ${btnStyle}`}
                        >
                          <div className="flex gap-2">
                            <span className="font-extrabold uppercase shrink-0">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span>{opt}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {activeDeck.cards[currentCardIndex].userAnswer !== undefined && 
                   activeDeck.cards[currentCardIndex].userAnswer !== null && (
                    <div className="bg-[#1b2535]/50 rounded-xl p-2.5 border border-[#232d3f] flex items-start gap-2">
                      {activeDeck.cards[currentCardIndex].userAnswer === activeDeck.cards[currentCardIndex].correctOptionIndex ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="text-[9.5px] text-[#94a3b8] leading-normal">
                            <span className="text-emerald-400 font-bold">Correct!</span> Flip the card to read the complete technical reference logs.
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <div className="text-[9.5px] text-[#94a3b8] leading-normal">
                            <span className="text-red-400 font-bold">Incorrect.</span> The correct answer was option {String.fromCharCode(65 + activeDeck.cards[currentCardIndex].correctOptionIndex)}. Flip to learn why.
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )
      )}

      {/* ==================== AI GENERATOR MODAL ==================== */}
      {showGeneratorModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="h-14 border-b border-[#232d3f] px-6 flex items-center justify-between bg-[#131a26]">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" /> AI Flashcard Deck Builder
              </span>
              <button
                onClick={() => !isGenerating && setShowGeneratorModal(false)}
                className="text-gray-500 hover:text-white transition cursor-pointer"
                disabled={isGenerating}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {isGenerating ? (
                /* AI Generation Loading State */
                <div className="py-12 space-y-6 text-center">
                  <Brain className="w-16 h-16 text-indigo-400 mx-auto animate-bounce" />
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-white">AI Engine Running...</p>
                    <p className="text-xs text-indigo-400 font-bold animate-pulse">{generationStep}</p>
                    <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                      Formulating high-quality multiple choice question parameters and technical option lists...
                    </p>
                  </div>
                  
                  {/* Fake Loader Bar */}
                  <div className="w-48 bg-[#1b2535] h-1.5 rounded-full overflow-hidden mx-auto border border-[#232d3f]">
                    <div className="bg-indigo-500 h-full rounded-full animate-progress" />
                  </div>
                </div>
              ) : (
                /* Generator Form */
                <form onSubmit={handleAiGenerate} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#94a3b8] uppercase">Topic / Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. React Hooks, Docker Volumes, System Sharding"
                      value={generatorTopic}
                      onChange={e => setGeneratorTopic(e.target.value)}
                      className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                      required
                    />
                  </div>

                  {/* Suggestion Pills */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-gray-500 font-bold block">Popular suggestions:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {topicPills.map(pill => (
                        <button
                          key={pill}
                          type="button"
                          onClick={() => setGeneratorTopic(pill)}
                          className="bg-[#1b2535] hover:bg-[#232d3f] border border-[#232d3f] text-[#94a3b8] hover:text-white px-2.5 py-1 rounded-lg text-[10px] transition cursor-pointer"
                        >
                          {pill}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#94a3b8] uppercase">Difficulty</label>
                      <select
                        value={generatorDifficulty}
                        onChange={e => setGeneratorDifficulty(e.target.value as any)}
                        className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="super_hard">Super Hard</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#94a3b8] uppercase">Card Count (1-50)</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        placeholder="Enter number of cards..."
                        value={generatorCount}
                        onChange={e => {
                          const val = e.target.value;
                          setGeneratorCount(val === '' ? '' : Math.min(50, Math.max(1, Number(val))));
                        }}
                        className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowGeneratorModal(false)}
                      className="px-4 py-2 bg-[#1b2535] hover:bg-[#232d3f] text-[#94a3b8] hover:text-white rounded-xl text-xs transition border border-[#232d3f] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition duration-200 cursor-pointer"
                    >
                      Generate Cards
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default FlashcardDashboard;
