'use client';

import React, { useState } from 'react';
import { Key } from 'lucide-react';

interface NavbarProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  onReset?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ apiKey, setApiKey, onReset }) => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);

  const saveKey = () => {
    setApiKey(tempKey);
    setShowKeyModal(false);
  };

  return (
    <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
        <button
          onClick={onReset}
          className="text-sm font-medium tracking-tight text-zinc-200 hover:text-white transition flex items-center gap-2"
        >
          <span>Sulah</span>
          <span className="text-zinc-600 font-normal">/ صلح</span>
        </button>

        <button
          onClick={() => setShowKeyModal(true)}
          className={`flex items-center gap-1.5 text-xs transition px-2.5 py-1 rounded-md border ${
            apiKey
              ? 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
              : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
          }`}
        >
          <Key className="w-3 h-3" />
          <span>{apiKey ? 'API Key set' : 'API Key'}</span>
        </button>
      </div>

      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Gemini API Key</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Optional. If left blank, Sulah uses the built-in deterministic simulation.
              </p>
            </div>

            <input
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="Paste AIzaSy... key"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
            />

            <div className="flex items-center justify-end gap-2 pt-2 text-xs">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={saveKey}
                className="px-3.5 py-1.5 bg-zinc-100 text-zinc-900 font-medium rounded-lg hover:bg-white transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
