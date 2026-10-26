import { SCENARIOS, Scenario, EvaluationResult } from '@/data/scenarios';

// Smart simulated replies for offline / zero-API-key mode
export function getSimulatedReply(
  scenario: Scenario,
  conversationHistory: { sender: 'character' | 'user'; text: string }[],
  latestUserMessage: string
): { text: string; tension: number } {
  const lowerMsg = latestUserMessage.toLowerCase();
  
  // Count turns
  const userTurns = conversationHistory.filter(m => m.sender === 'user').length;
  
  // Detect positive de-escalation markers
  const apologyWords = ['sorry', 'apologize', 'my fault', 'my bad', 'regret', 'take responsibility', 'apologies', 'maaf', 'hear you'];
  const empathyWords = ['understand', 'hear you', 'frustrating', 'stressful', 'exhausting', 'makes sense', 'valid', 'fair point', 'see where you are coming from', 'samajh', 'partners', 'lovers', 'together', 'love you', 'care'];
  const solutionWords = ['next step', 'resolve', 'fix this', 'how can we', 'let me', 'solution', 'action plan', 'compensate', 'refund', 'credit', 'meet up', 'discuss', 'do it', 'clean', 'dishes', 'help'];
  
  // Detect negative escalation markers
  const defensiveWords = ['calm down', 'relax', 'overreacting', 'crazy', 'not my fault', 'deal with it', 'shut up', 'whatever', 'your problem', 'suck it up', 'dramatic'];
  
  const hasApology = apologyWords.some(w => lowerMsg.includes(w));
  const hasEmpathy = empathyWords.some(w => lowerMsg.includes(w));
  const hasSolution = solutionWords.some(w => lowerMsg.includes(w));
  const isHostile = defensiveWords.some(w => lowerMsg.includes(w));

  // Determine tension change
  let scoreDelta = 0;
  if (isHostile) scoreDelta += 25;
  if (hasEmpathy) scoreDelta -= 15;
  if (hasApology) scoreDelta -= 12;
  if (hasSolution) scoreDelta -= 10;
  
  // Previous tension baseline
  const baseTension = Math.max(20, Math.min(95, 80 - (userTurns * 12) + scoreDelta));

  // 1. Workplace - Stolen credit (Manish)
  if (scenario.id === 'workplace-credit') {
    if (isHostile) {
      return {
        text: "Are you serious right now? Telling me to 'calm down'? I spent nights structuring that pitch! If this is how you handle collaboration, maybe we shouldn't partner on future accounts at all.",
        tension: Math.min(100, baseTension + 20)
      };
    }
    if (hasEmpathy && (hasSolution || hasApology)) {
      return {
        text: "Look... I appreciate you being direct and calm about this. You're right, it was a major team effort and you did the lion's share of data synthesis. Let me send an email to leadership right now copying you, attaching the detailed appendix with your name explicitly credited as lead analyst.",
        tension: Math.max(15, baseTension - 25)
      };
    }
    return {
      text: "I hear what you're saying, but the deck format had strict template restrictions from the leadership team. Still, I get that it felt dismissive. What do you suggest we do about it now?",
      tension: Math.max(30, baseTension - 5)
    };
  }

  // 2. Workplace - Delayed release (Sneha)
  if (scenario.id === 'workplace-deadline') {
    if (isHostile) {
      return {
        text: "Unbelievable. Shifting the blame to requirements when the QA ticket sat unassigned for two days? I will make sure this is thoroughly documented in the post-mortem.",
        tension: Math.min(100, baseTension + 25)
      };
    }
    if (hasEmpathy || hasSolution) {
      return {
        text: "Okay... thank you for keeping a level head. I was about to lose it with the delivery head calling non-stop. Let's get that recovery email out to the client together with the updated deployment window.",
        tension: Math.max(20, baseTension - 20)
      };
    }
    return {
      text: "I just need to know what to tell leadership within the next 20 minutes so they don't escalate. Walk me through the exact deployment ETA.",
      tension: Math.max(35, baseTension - 5)
    };
  }

  // 3. Relationship - Household chores (Pooja)
  if (scenario.id === 'relationship-chores') {
    if (isHostile) {
      return {
        text: "Telling me I'm 'overreacting' just proves my exact point. It's not about the dishes, it's about feeling like you don't respect my time or our home. I don't even feel like talking right now.",
        tension: Math.min(100, baseTension + 30)
      };
    }
    if (hasEmpathy || hasApology || hasSolution) {
      return {
        text: "Thank you for saying that... hearing you acknowledge it and call us partners means a lot. I'm just so drained after today. If we can tackle the kitchen together right now or if you can handle it while I wash up, I would really appreciate it.",
        tension: Math.max(20, baseTension - 25)
      };
    }
    return {
      text: "I know you're busy too, but it feels like whenever you get tired, our agreements get forgotten. Can we please just take care of it tonight?",
      tension: Math.max(35, baseTension - 10)
    };
  }

  // 4. Relationship - Finances (Rohan)
  if (scenario.id === 'relationship-finances') {
    if (isHostile) {
      return {
        text: "Saying 'it's my salary too' is completely missing the point. We agreed on a family deposit fund. If you're going to make 65,000 rupee purchases unilaterally, how are we ever going to buy a home?",
        tension: Math.min(100, baseTension + 25)
      };
    }
    if (hasEmpathy || hasApology || hasSolution) {
      return {
        text: "I appreciate you owning up to this and not getting defensive. It really freaked me out to see that notification. Let's return it or move that money back from personal savings so our target isn't delayed.",
        tension: Math.max(25, baseTension - 25)
      };
    }
    return {
      text: "We need complete transparency if we are managing joint finances. How do you plan to balance the budget for this month now?",
      tension: Math.max(40, baseTension - 10)
    };
  }

  // 5. Customer - Refund (Vikramaditya Singhania)
  if (scenario.id === 'customer-refund') {
    if (isHostile) {
      return {
        text: "Don't quote the SLA or tell me to log a portal ticket! Do you think our board cares about your SLA disclaimer when our Chairman was humiliated in front of 500 investors?! I will personally ensure our legal counsel terminates our vendor contract.",
        tension: 98
      };
    }
    if (hasEmpathy && (hasApology || hasSolution)) {
      return {
        text: "I appreciate you owning up to this immediately instead of giving scripted replies. Having our summit disrupted was unacceptable for our brand. I want that executive engineering root cause briefing by 10 AM tomorrow, and we will talk through SLA account credits then.",
        tension: Math.max(30, baseTension - 25)
      };
    }
    return {
      text: "We pay top tier enterprise pricing for this infrastructure. I need an immediate explanation for why backup failover didn't trigger, not platitudes.",
      tension: Math.max(50, baseTension - 10)
    };
  }

  // 6. Friendship - Excluded (Ananya)
  if (scenario.id === 'friendship-excluded') {
    if (isHostile) {
      return {
        text: "I knew messaging you was a mistake. You clearly don't care how your actions make people feel.",
        tension: Math.min(100, baseTension + 25)
      };
    }
    if (hasEmpathy || hasApology) {
      return {
        text: "Thanks for taking the time to listen and not just dismiss me. It really hurt seeing the photos, but hearing you explain it sincerely helps a lot. Let's catch up this weekend and put this behind us.",
        tension: Math.max(15, baseTension - 25)
      };
    }
    return {
      text: "It just felt like I was the only one left out of the group. What actually happened?",
      tension: Math.max(35, baseTension - 10)
    };
  }

  // Default fallback
  return {
    text: "Thanks for talking this through with me calmly. Let's make sure we stay on the same page.",
    tension: Math.max(20, baseTension - 15)
  };
}

export function getSimulatedEvaluation(
  scenario: Scenario,
  conversationHistory: { sender: 'character' | 'user'; text: string }[]
): EvaluationResult {
  const userMessages = conversationHistory.filter(m => m.sender === 'user').map(m => m.text);
  const combinedText = userMessages.join(' ').toLowerCase();

  const apologies = ['sorry', 'apologize', 'responsibility', 'my bad', 'maaf'].filter(w => combinedText.includes(w)).length;
  const empathy = ['understand', 'hear you', 'frustrating', 'stressful', 'valid', 'fair', 'samajh', 'partners', 'lovers'].filter(w => combinedText.includes(w)).length;
  const solutions = ['solve', 'fix', 'step', 'plan', 'resolve', 'together', 'meeting', 'action', 'clean'].filter(w => combinedText.includes(w)).length;
  const defensive = ['calm down', 'relax', 'overreacting', 'crazy', 'shut up'].filter(w => combinedText.includes(w)).length;

  let listeningScore = Math.min(95, 60 + empathy * 12);
  let empathyScore = Math.min(95, 55 + empathy * 15 + apologies * 8);
  let regulationScore = Math.max(30, 85 - defensive * 25);
  let solutionScore = Math.min(95, 60 + solutions * 12);

  const overallScore = Math.round((listeningScore + empathyScore + regulationScore + solutionScore) / 4);

  let verdict: EvaluationResult['overallVerdict'] = 'De-escalated Successfully';
  if (overallScore < 55 || defensive > 1) {
    verdict = 'Escalated / Unresolved';
  } else if (overallScore < 75) {
    verdict = 'Partially Resolved';
  }

  return {
    score: overallScore,
    overallVerdict: verdict,
    summary: `You engaged in a ${userMessages.length}-turn dialogue with ${scenario.characterName}. ` +
      (overallScore >= 75
        ? 'You demonstrated remarkable composure, validated their emotional needs, and steered the heated conversation toward productive resolution.'
        : overallScore >= 55
        ? 'You made good headway in hearing their complaint, though some defensiveness or missed emotional cues prevented complete de-escalation.'
        : 'The conversation remained tense. Heated language or dismissive phrasing triggered defensiveness rather than resolution.'),
    strengths: [
      listeningScore >= 70 ? 'Strong reflective listening and acknowledgment of the counterpart\'s feelings.' : 'Direct engagement without walking away from tension.',
      solutionScore >= 70 ? 'Action-oriented approach that proposed clear subsequent steps.' : 'Kept responses concise rather than escalating into rambling arguments.',
      regulationScore >= 75 ? 'Resisted the temptation to fight fire with fire or tell them to "calm down".' : 'Recognized the gravity of the situation.'
    ],
    areasToImprove: [
      defensive > 0 ? 'Avoid trigger phrases like "calm down" or "you are overreacting", which inflame tensions.' : 'Strive to name the specific emotion the counterpart is experiencing.',
      solutions < 2 ? 'Pivot sooner to concrete next steps once emotional air has cleared.' : 'Ensure mutual accountability is reinforced so future recurrences are prevented.',
      'Check in with open-ended clarifying questions before proposing a remedy.'
    ],
    techniqueBreakdown: {
      activeListening: listeningScore,
      empathyValidation: empathyScore,
      emotionalRegulation: regulationScore,
      solutionOrientation: solutionScore
    },
    keyTakeaways: [
      'De-escalation begins with acknowledging their emotion before correcting any factual discrepancies.',
      'Never tell an agitated person to "calm down"—instead, model the calm you want them to mirror.',
      'Separate the person\'s character from the conflict action to protect long-term trust.'
    ]
  };
}
