'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Scenario, ChatMessage, EvaluationResult } from '@/data/scenarios';
import { TensionMeter } from './TensionMeter';
import { FeedbackModal } from './FeedbackModal';
import { ArrowLeft, ArrowUp, Info } from 'lucide-react';

interface SimulationRoomProps {
  scenario: Scenario;
  apiKey: string;
  onExit: () => void;
}

export const SimulationRoom: React.FC<SimulationRoomProps> = ({
  scenario,
  apiKey,
  onExit,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'character',
      text: scenario.initialMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tensionLevel: 80,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [currentTension, setCurrentTension] = useState(80);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showContext, setShowContext] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const userText = inputText.trim();
    setInputText('');

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, newMsg];
    setMessages(updatedHistory);
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          messages: updatedHistory.map((m) => ({ sender: m.sender, text: m.text })),
          userApiKey: apiKey,
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
      }
    } catch (err) {
      console.error('Failed to communicate with simulator:', err);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleEndSession = async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          messages: messages.map((m) => ({ sender: m.sender, text: m.text })),
          userApiKey: apiKey,
        }),
      });
      const data = await res.json();
      if (data.evaluation) {
        setEvaluation(data.evaluation);
      }
    } catch (err) {
      console.error('Failed to generate evaluation:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRetry = () => {
    setEvaluation(null);
    setCurrentTension(80);
    setMessages([
      {
        id: '1',
        sender: 'character',
        text: scenario.initialMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tensionLevel: 80,
      },
    ]);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Minimal Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-900 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xs font-medium text-zinc-200">{scenario.title}</h2>
            <p className="text-[11px] text-zinc-500">with {scenario.characterName}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <TensionMeter tension={currentTension} />

          <button
            onClick={() => setShowContext(!showContext)}
            className={`p-1.5 rounded-md border text-xs transition ${
              showContext
                ? 'border-zinc-700 text-zinc-200 bg-zinc-900'
                : 'border-zinc-900 text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle context"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleEndSession}
            disabled={messages.length <= 1 || isEvaluating}
            className={`text-xs px-2.5 py-1 rounded-md border transition font-mono ${
              messages.length > 1
                ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-900'
                : 'border-zinc-900 text-zinc-700 cursor-not-allowed'
            }`}
          >
            {isEvaluating ? 'Evaluating...' : 'Finish & Review'}
          </button>
        </div>
      </div>

      {/* Context accordion */}
      {showContext && (
        <div className="py-3 px-4 my-2 border border-zinc-900 bg-zinc-900/30 rounded-lg text-xs space-y-2 text-zinc-400">
          <p><span className="text-zinc-300">Context:</span> {scenario.description}</p>
          <p><span className="text-zinc-300">Underlying needs:</span> {scenario.underlyingNeeds.join(', ')}</p>
        </div>
      )}

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto py-6 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[10px] font-mono text-zinc-600 mb-1 px-1">
                {isUser ? 'You' : scenario.characterName}
              </span>
              <div
                className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-zinc-100 text-zinc-950 font-normal'
                    : 'bg-zinc-900 text-zinc-200 border border-zinc-850'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="text-[11px] font-mono text-zinc-600">
            {scenario.characterName} is responding...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="pt-3 border-t border-zinc-900">
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
            rows={1}
            placeholder={`Reply to ${scenario.characterName}...`}
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 pr-10 resize-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className={`absolute right-2 p-1.5 rounded-md transition ${
              inputText.trim() && !isSending
                ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="flex justify-between items-center text-[10px] text-zinc-600 mt-2 px-1">
          <span>Enter to send, Shift+Enter for newline</span>
          <span className="font-mono">{messages.filter(m => m.sender === 'user').length} turns</span>
        </div>
      </div>

      {/* Debrief Modal */}
      {evaluation && (
        <FeedbackModal
          evaluation={evaluation}
          scenario={scenario}
          onRetry={handleRetry}
          onExit={onExit}
        />
      )}
    </div>
  );
};
