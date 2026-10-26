'use client';

import React, { useState, useEffect } from 'react';

export default function VoicesProbe() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        setVoices(window.speechSynthesis.getVoices());
      }
    };
    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const testVoice = (v: SpeechSynthesisVoice) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance("I honestly cannot do this anymore. You promised you would take care of it by 6 PM.");
    u.voice = v;
    u.rate = 1.0;
    u.pitch = 1.0;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="p-8 text-xs font-mono text-zinc-200 max-w-4xl mx-auto space-y-4">
      <h1 className="text-lg font-bold text-white">Browser Voices ({voices.length})</h1>
      <p className="text-zinc-400">Click &ldquo;Test Voice&rdquo; on any voice below to hear Pooja&apos;s exact dialogue in that voice:</p>
      
      <div className="space-y-2">
        {voices.map((v, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded bg-zinc-900 border border-zinc-800">
            <div>
              <span className="font-semibold text-zinc-100">{v.name}</span>
              <span className="text-zinc-500 ml-2">({v.lang})</span>
              {v.default && <span className="ml-2 text-indigo-400 font-bold">[Default]</span>}
              {v.localService ? <span className="ml-2 text-amber-500">[Local]</span> : <span className="ml-2 text-emerald-400">[Online/Neural]</span>}
            </div>
            <button
              onClick={() => testVoice(v)}
              className="px-3 py-1 bg-zinc-100 text-zinc-950 font-bold rounded hover:bg-white"
            >
              Test Voice
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
