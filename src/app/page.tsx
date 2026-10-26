'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SCENARIOS, Scenario, ChatMessage, EvaluationResult } from '@/data/scenarios';
import { VoiceNarrator } from '@/lib/tts';
import { VoiceRecognizer } from '@/lib/stt';
import { 
  ArrowRight, 
  ArrowLeft, 
  ArrowUp, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Play, 
  Mic, 
  MicOff 
} from 'lucide-react';

type Step = 'welcome' | 'context' | 'scenario' | 'briefing' | 'simulation' | 'debrief';

export default function Home() {
  const [step, setStep] = useState<Step>('welcome');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  // Audio / Narration state
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // STT Microphone state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [sttError, setSttError] = useState<string | null>(null);

  // Simulation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [currentTension, setCurrentTension] = useState(80);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const toggleAudio = () => {
    const nextState = !isAudioEnabled;
    setIsAudioEnabled(nextState);
    VoiceNarrator.setMuted(!nextState);
    if (!nextState) {
      VoiceNarrator.stop();
      setIsSpeaking(false);
    }
  };

  const narrate = (text: string) => {
    if (!isAudioEnabled) return;
    setIsSpeaking(true);
    VoiceNarrator.speakNarration(text, () => setIsSpeaking(false));
  };

  // Toggle Microphone STT
  const handleToggleMic = () => {
    if (isListening) {
      VoiceRecognizer.stopListening();
      setIsListening(false);
      return;
    }

    setSttError(null);
    const success = VoiceRecognizer.startListening(
      (transcript, isFinal) => {
        setInputText((prev) => {
          if (!prev) return transcript;
          return prev.trimEnd() + ' ' + transcript;
        });
        if (isFinal) {
          setIsListening(false);
        }
      },
      (err) => {
        setSttError(err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (success) {
      setIsListening(true);
      VoiceNarrator.stop();
    }
  };

  // Step 1 Categories
  const categoryOptions = [
    {
      id: 'workplace',
      title: 'Workplace & Colleagues',
      desc: 'Missed deadlines, credit issues, and disagreements with co-workers.',
    },
    {
      id: 'relationship',
      title: 'Partner & Family Life',
      desc: 'Household chores, unbudgeted purchases, and feeling unheard.',
    },
    {
      id: 'customer',
      title: 'Clients & Customers',
      desc: 'Upset enterprise clients, product outages, and refund requests.',
    },
    {
      id: 'friendship',
      title: 'Friends & Social Circle',
      desc: 'Excluded from gatherings, misunderstandings, and hurt feelings.',
    },
  ];

  // Auto-narrate on step transitions
  useEffect(() => {
    if (!isAudioEnabled) return;

    if (step === 'welcome') {
      narrate("Welcome to Sulah. This is a quiet space to practice handling difficult conversations calmly. When you are ready, tap begin practice.");
    } else if (step === 'context') {
      narrate("Step 2. Where did the disagreement take place? Choose between Workplace, Home life, Clients, or Friends.");
    } else if (step === 'scenario') {
      narrate("Step 3. Select a specific situation you would like to work through.");
    } else if (step === 'briefing' && selectedScenario) {
      narrate(`Briefing for ${selectedScenario.title}. Here is the situation: ${selectedScenario.description}. ${selectedScenario.characterName} begins with: ${selectedScenario.initialMessage}. Your goal is to listen patiently, acknowledge their feelings, and find a calm resolution.`);
    } else if (step === 'debrief' && evaluation) {
      narrate(`Session completed with a score of ${evaluation.score} out of 100. Outcome: ${evaluation.overallVerdict}. ${evaluation.summary}`);
    }
  }, [step, selectedScenario]);

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setStep('scenario');
  };

  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setStep('briefing');
  };

  const handleStartSimulation = () => {
    if (!selectedScenario) return;
    const initialText = selectedScenario.initialMessage;
    setMessages([
      {
        id: '1',
        sender: 'character',
        text: initialText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tensionLevel: 80,
      },
    ]);
    setCurrentTension(80);
    setEvaluation(null);
    setStep('simulation');

    if (isAudioEnabled) {
      VoiceNarrator.speakDialogue(selectedScenario.characterName, initialText);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending || !selectedScenario) return;

    if (isListening) {
      VoiceRecognizer.stopListening();
      setIsListening(false);
    }

    const userText = inputText.trim();
    setInputText('');

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: selectedScenario.id,
          messages: updated.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'character',
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            tensionLevel: data.tension ?? currentTension,
          },
        ]);
        if (typeof data.tension === 'number') {
          setCurrentTension(data.tension);
        }

        if (isAudioEnabled) {
          VoiceNarrator.speakDialogue(selectedScenario.characterName, data.reply);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleFinishSimulation = async () => {
    if (!selectedScenario) return;
    if (isListening) {
      VoiceRecognizer.stopListening();
      setIsListening(false);
    }
    setIsEvaluating(true);
    VoiceNarrator.stop();

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: selectedScenario.id,
          messages: messages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });
      const data = await res.json();
      if (data.evaluation) {
        setEvaluation(data.evaluation);
        setStep('debrief');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetAll = () => {
    VoiceNarrator.stop();
    if (isListening) {
      VoiceRecognizer.stopListening();
      setIsListening(false);
    }
    setSelectedCategory(null);
    setSelectedScenario(null);
    setMessages([]);
    setEvaluation(null);
    setCurrentTension(80);
    setStep('welcome');
  };

  const getStepProgress = () => {
    switch (step) {
      case 'welcome': return { current: 1, total: 5, label: 'Start' };
      case 'context': return { current: 2, total: 5, label: 'Choose Area' };
      case 'scenario': return { current: 3, total: 5, label: 'Pick Scenario' };
      case 'briefing': return { current: 4, total: 5, label: 'Read Briefing' };
      case 'simulation': return { current: 5, total: 5, label: 'Conversation' };
      case 'debrief': return { current: 5, total: 5, label: 'Feedback' };
    }
  };

  const progress = getStepProgress();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans text-base sm:text-lg">
      {/* Top Bar - Clean and stripped of client API key prompts */}
      <header className="border-b border-zinc-900 bg-zinc-950/85 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={resetAll}
            className="text-base sm:text-lg font-medium text-zinc-300 hover:text-white transition"
          >
            Sulah <span className="text-zinc-500 font-normal">/ صلح</span>
          </button>

          {/* Stepper info & Voice Narration Toggle */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={toggleAudio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs sm:text-sm transition ${
                isAudioEnabled
                  ? 'border-zinc-700 bg-zinc-900 text-zinc-200'
                  : 'border-zinc-900 text-zinc-500 hover:text-zinc-400'
              }`}
              title={isAudioEnabled ? 'Voice narration on' : 'Voice narration muted'}
            >
              {isAudioEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-zinc-200" />
                  <span className="hidden sm:inline">Narration On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-zinc-500" />
                  <span className="hidden sm:inline">Muted</span>
                </>
              )}
            </button>

            <span className="text-xs sm:text-sm font-mono text-zinc-400">
              {progress.label} ({progress.current}/{progress.total})
            </span>
          </div>
        </div>
      </header>

      {/* Main Linear Canvas */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col justify-center">

        {/* STEP 1: WELCOME / INTENT */}
        {step === 'welcome' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-mono text-zinc-500 uppercase tracking-wider">
                  Step 1 of 5 — Getting Started
                </span>
                {isAudioEnabled && (
                  <button
                    onClick={() => narrate("Welcome to Sulah. This is a quiet space to practice handling difficult conversations calmly. When you are ready, tap begin practice.")}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    <Play className="w-3.5 h-3.5" /> Read aloud
                  </button>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-100 leading-tight">
                Practice handling difficult conversations calmly.
              </h1>
              <p className="text-base sm:text-xl text-zinc-400 leading-relaxed max-w-xl">
                A simple step-by-step simulator to help you defuse emotional situations, keep your composure, and receive clear coaching feedback.
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setStep('context')}
                className="inline-flex items-center gap-3 px-7 py-4 bg-zinc-100 hover:bg-white text-zinc-950 text-base sm:text-lg font-medium rounded-xl transition shadow-sm"
              >
                <span>Begin practice</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CONTEXT SELECTION */}
        {step === 'context' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-mono text-zinc-500 uppercase tracking-wider">
                  Step 2 of 5 — Choose Area
                </span>
                {isAudioEnabled && (
                  <button
                    onClick={() => narrate("Where did the disagreement happen? Choose Workplace, Partner, Clients, or Friends.")}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    <Play className="w-3.5 h-3.5" /> Read aloud
                  </button>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-100">
                Where did the disagreement happen?
              </h2>
              <p className="text-sm sm:text-base text-zinc-400">
                Pick the setting you would like to practice with today.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {categoryOptions.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className="w-full text-left p-5 sm:p-6 rounded-2xl border border-zinc-900 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/70 transition group flex items-center justify-between"
                >
                  <div className="space-y-1.5 pr-4">
                    <span className="text-base sm:text-lg font-medium text-zinc-200 group-hover:text-white transition block">
                      {cat.title}
                    </span>
                    <span className="text-sm sm:text-base text-zinc-400 block leading-relaxed">
                      {cat.desc}
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-1 transition shrink-0" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('welcome')}
              className="text-sm sm:text-base text-zinc-400 hover:text-zinc-200 flex items-center gap-2 transition pt-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>
        )}

        {/* STEP 3: SPECIFIC SCENARIO SELECTION */}
        {step === 'scenario' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2">
              <span className="text-xs sm:text-sm font-mono text-zinc-500 uppercase tracking-wider block">
                Step 3 of 5 — Select Situation
              </span>
              <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-100">
                Choose a specific scenario
              </h2>
              <p className="text-sm sm:text-base text-zinc-400">
                Each situation simulates a realistic conversation with an upset counterpart.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {SCENARIOS.filter((s) => s.category === selectedCategory).map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleSelectScenario(scenario)}
                  className="w-full text-left p-5 sm:p-6 rounded-2xl border border-zinc-900 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/70 transition group space-y-3"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-base sm:text-lg font-medium text-zinc-200 group-hover:text-white transition">
                      {scenario.title}
                    </span>
                    <span className="text-xs sm:text-sm font-mono text-zinc-400 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800">
                      {scenario.difficulty}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                    {scenario.description}
                  </p>
                  <div className="text-xs sm:text-sm text-zinc-400 font-mono pt-1">
                    Talking with: <span className="text-zinc-200">{scenario.characterName}</span> ({scenario.characterRole})
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('context')}
              className="text-sm sm:text-base text-zinc-400 hover:text-zinc-200 flex items-center gap-2 transition pt-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to areas</span>
            </button>
          </div>
        )}

        {/* STEP 4: PRE-FLIGHT BRIEFING */}
        {step === 'briefing' && selectedScenario && (
          <div className="space-y-7 animate-in fade-in duration-300">
            <div className="space-y-2 border-b border-zinc-900 pb-5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-mono text-zinc-500 uppercase tracking-wider">
                  Step 4 of 5 — Briefing
                </span>
                {isAudioEnabled && (
                  <button
                    onClick={() => narrate(`Briefing for ${selectedScenario.title}. Background: ${selectedScenario.description}. First message from ${selectedScenario.characterName}: ${selectedScenario.initialMessage}.`)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    <Play className="w-3.5 h-3.5" /> Read aloud
                  </button>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-100">
                {selectedScenario.title}
              </h2>
              <p className="text-sm sm:text-base text-zinc-400">
                Counterpart: <span className="text-zinc-200 font-medium">{selectedScenario.characterName}</span> ({selectedScenario.characterRole})
              </p>
            </div>

            <div className="space-y-5 text-sm sm:text-base">
              <div className="space-y-2">
                <span className="font-mono text-zinc-400 uppercase text-xs tracking-wider block">Background</span>
                <p className="text-zinc-200 leading-relaxed bg-zinc-900/50 p-4 sm:p-5 rounded-xl border border-zinc-900">
                  {selectedScenario.description}
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-zinc-400 uppercase text-xs tracking-wider block">
                  First message from {selectedScenario.characterName}
                </span>
                <p className="text-zinc-100 leading-relaxed bg-zinc-900/50 p-4 sm:p-5 rounded-xl border border-zinc-900 border-l-4 border-l-zinc-400 italic">
                  &ldquo;{selectedScenario.initialMessage}&rdquo;
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <span className="font-mono text-zinc-400 uppercase text-xs tracking-wider block">Your goal</span>
                <p className="text-zinc-300 leading-relaxed">
                  Listen patiently without arguing, acknowledge how they feel, and propose a sensible next step. When you feel the conversation is settled, tap finish to view your results.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-zinc-900">
              <button
                onClick={() => setStep('scenario')}
                className="text-sm sm:text-base text-zinc-400 hover:text-zinc-200 flex items-center gap-2 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                onClick={handleStartSimulation}
                className="inline-flex items-center gap-3 px-6 py-3.5 bg-zinc-100 hover:bg-white text-zinc-950 text-sm sm:text-base font-medium rounded-xl transition"
              >
                <span>Enter conversation</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: ACTIVE SIMULATION ROOM */}
        {step === 'simulation' && selectedScenario && (
          <div className="flex flex-col h-[78vh] animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
              <div>
                <span className="text-base sm:text-lg font-medium text-zinc-100 block">
                  {selectedScenario.characterName}
                </span>
                <span className="text-xs sm:text-sm font-mono text-zinc-400">
                  Agitation level: {currentTension}%
                </span>
              </div>

              <button
                onClick={handleFinishSimulation}
                disabled={messages.length <= 1 || isEvaluating}
                className={`text-xs sm:text-sm px-4 py-2.5 rounded-xl border font-medium transition ${
                  messages.length > 1
                    ? 'border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800'
                    : 'border-zinc-900 text-zinc-600 cursor-not-allowed'
                }`}
              >
                {isEvaluating ? 'Grading conversation...' : 'Conclude & Review →'}
              </button>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto py-6 space-y-5">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-mono text-zinc-400">
                        {isUser ? 'You' : selectedScenario.characterName}
                      </span>
                      {!isUser && isAudioEnabled && (
                        <button
                          onClick={() => VoiceNarrator.speakDialogue(selectedScenario.characterName, msg.text)}
                          className="text-zinc-500 hover:text-zinc-300 transition"
                          title="Replay audio"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-base sm:text-lg leading-relaxed ${
                        isUser
                          ? 'bg-zinc-100 text-zinc-950 font-normal'
                          : 'bg-zinc-900 text-zinc-100 border border-zinc-800'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {isSending && (
                <div className="text-sm font-mono text-zinc-400 px-2">
                  {selectedScenario.characterName} is replying...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer with Speech-to-Text Microphone */}
            <div className="pt-4 border-t border-zinc-900 space-y-2">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  placeholder={
                    isListening
                      ? 'Listening to you speak... (speak now)'
                      : `Speak or type your response to ${selectedScenario.characterName}...`
                  }
                  className={`w-full bg-zinc-900/60 border rounded-xl px-4 py-3 text-base sm:text-lg text-zinc-100 placeholder-zinc-500 focus:outline-none pr-28 resize-none leading-relaxed transition ${
                    isListening
                      ? 'border-rose-500/80 ring-2 ring-rose-500/20 bg-rose-950/10'
                      : 'border-zinc-800 focus:border-zinc-500'
                  }`}
                />

                {/* Right controls: Mic button + Send button */}
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleMic}
                    className={`p-2.5 rounded-lg border transition ${
                      isListening
                        ? 'bg-rose-500 border-rose-400 text-white animate-pulse shadow-md shadow-rose-500/20'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700'
                    }`}
                    title={isListening ? 'Stop listening' : 'Speak your message (Voice STT)'}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4 text-white" />
                    ) : (
                      <Mic className="w-4 h-4 text-zinc-300" />
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className={`p-2.5 rounded-lg transition ${
                      inputText.trim() && !isSending
                        ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                        : 'text-zinc-600 bg-zinc-900 cursor-not-allowed border border-zinc-800'
                    }`}
                    aria-label="Send reply"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {sttError && (
                <div className="text-xs text-rose-400 px-1">
                  Microphone note: {sttError}. Please ensure mic permission is granted in browser.
                </div>
              )}

              <div className="flex justify-between items-center text-xs sm:text-sm text-zinc-400 px-1 font-mono">
                <span>{isListening ? '🔴 Recording speech...' : 'Tap the microphone to speak, or press Enter'}</span>
                <span>{messages.filter((m) => m.sender === 'user').length} turns</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: FINAL DEBRIEF */}
        {step === 'debrief' && evaluation && selectedScenario && (
          <div className="space-y-7 animate-in fade-in duration-300">
            <div className="flex items-start justify-between border-b border-zinc-900 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-zinc-400">
                    Step 5 of 5 — Session Feedback
                  </span>
                  {isAudioEnabled && (
                    <button
                      onClick={() => narrate(`Session completed with a score of ${evaluation.score} out of 100. Outcome: ${evaluation.overallVerdict}. ${evaluation.summary}`)}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                    >
                      <Play className="w-3.5 h-3.5" /> Read aloud
                    </button>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100 mt-1">
                  {selectedScenario.title}
                </h2>
                <p className="text-sm sm:text-base text-zinc-300 mt-1">
                  Outcome: <span className="text-zinc-100 font-medium">{evaluation.overallVerdict}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-zinc-400 uppercase block">Score</span>
                <span className="text-3xl sm:text-4xl font-mono text-zinc-100 font-medium">{evaluation.score}</span>
                <span className="text-sm text-zinc-400 font-mono">/100</span>
              </div>
            </div>

            <p className="text-base sm:text-lg text-zinc-200 leading-relaxed bg-zinc-900/40 p-5 rounded-2xl border border-zinc-900">
              {evaluation.summary}
            </p>

            {/* Performance Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-900">
                <span className="text-xs font-mono text-zinc-400 uppercase block">Listening</span>
                <span className="text-base sm:text-lg font-mono text-zinc-100 font-medium mt-1 block">
                  {evaluation.techniqueBreakdown.activeListening}%
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-900">
                <span className="text-xs font-mono text-zinc-400 uppercase block">Empathy</span>
                <span className="text-base sm:text-lg font-mono text-zinc-100 font-medium mt-1 block">
                  {evaluation.techniqueBreakdown.empathyValidation}%
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-900">
                <span className="text-xs font-mono text-zinc-400 uppercase block">Regulation</span>
                <span className="text-base sm:text-lg font-mono text-zinc-100 font-medium mt-1 block">
                  {evaluation.techniqueBreakdown.emotionalRegulation}%
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-900">
                <span className="text-xs font-mono text-zinc-400 uppercase block">Solutions</span>
                <span className="text-base sm:text-lg font-mono text-zinc-100 font-medium mt-1 block">
                  {evaluation.techniqueBreakdown.solutionOrientation}%
                </span>
              </div>
            </div>

            {/* Observations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
              <div className="space-y-2 p-4 sm:p-5 rounded-2xl border border-zinc-900 bg-zinc-900/30">
                <span className="font-mono text-zinc-300 text-xs sm:text-sm uppercase tracking-wider block">
                  What went well
                </span>
                <ul className="space-y-2 text-zinc-300">
                  {evaluation.strengths.slice(0, 2).map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-zinc-500 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 p-4 sm:p-5 rounded-2xl border border-zinc-900 bg-zinc-900/30">
                <span className="font-mono text-zinc-300 text-xs sm:text-sm uppercase tracking-wider block">
                  Room for growth
                </span>
                <ul className="space-y-2 text-zinc-300">
                  {evaluation.areasToImprove.slice(0, 2).map((a, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-zinc-500 font-bold">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Next Steps */}
            <div className="pt-6 border-t border-zinc-900 flex items-center justify-between">
              <button
                onClick={handleStartSimulation}
                className="flex items-center gap-2 text-sm sm:text-base text-zinc-400 hover:text-zinc-200 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice this one again</span>
              </button>

              <button
                onClick={() => setStep('scenario')}
                className="inline-flex items-center gap-2 px-5 py-3 bg-zinc-100 hover:bg-white text-zinc-950 text-sm sm:text-base font-medium rounded-xl transition"
              >
                <span>Next situation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
