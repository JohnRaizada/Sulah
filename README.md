# Sulah (صلح)

> An interactive conflict handling and de-escalation simulator designed to develop interpersonal communication skills under pressure.

Sulah provides a psychologically safe space to practice de-escalating tense confrontations across workplace, domestic, customer support, and personal scenarios.

---

## Highlights

- **Linear, Single-Track UX**: Guided 5-step journey (`Intent → Arena → Scenario → Briefing → Dialogue & Debrief`) engineered to eliminate decision fatigue.
- **Dynamic Tension Meter**: Visual real-time indicator tracking counterpart agitation from calm to boiling point.
- **Dual Voice Pipeline**:
  - Calm instructional text-to-speech (TTS) narration.
  - In-character spoken dialogue featuring high-fidelity neural voices (such as *Microsoft Neerja Online Natural* for female counterparts).
- **Speech-to-Text (STT) Voice Input**: Speak directly to counterparts via microphone instead of typing.
- **Diagnostic Debrief Matrix**: Scores and delivers qualitative feedback across four behavioral competencies:
  - Active Listening
  - Empathy & Validation
  - Emotional Regulation
  - Solution Orientation
- **Zero-Setup Offline Mode + Gemini Support**: Runs out-of-the-box using an intelligent deterministic simulation engine, or connects seamlessly to Google Gemini via `GEMINI_API_KEY`.

---

## Tech Stack

- **Framework**: Next.js 15 (React 19, TypeScript)
- **Styling**: Tailwind CSS (Minimalist Dark / High-Contrast Ergonomics)
- **Audio & Speech**: Web Speech API (SpeechSynthesis & SpeechRecognition)
- **AI Integration**: `@google/generative-ai`

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
If you wish to use live Google Gemini AI roleplaying, create a `.env.local` file:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```
*If left blank, Sulah automatically runs in built-in offline simulation mode.*

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scenarios

1. **Workplace**:
   - *The Stolen Presentation Credit* (with Manish Sharma)
   - *The Blame Game on Delayed Release* (with Sneha Kulkarni)
2. **Relationships & Home Life**:
   - *The Unbalanced Household Work* (with Pooja)
   - *The Unplanned Big Expense* (with Rohan)
3. **Customer Support**:
   - *Furious Corporate Client Demanding a Refund* (with Vikramaditya Singhania)
4. **Friendship**:
   - *Left Out of the Get-Together* (with Ananya)

---

## License
MIT
