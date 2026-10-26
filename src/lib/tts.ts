// Browser Text-To-Speech helper
export class VoiceNarrator {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static isMuted: boolean = false;

  public static setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
    }
  }

  public static getMuted(): boolean {
    return this.isMuted;
  }

  public static stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // EXACT original selector for narration - UNTOUCHED (A+)
  public static speakNarration(text: string, onEnd?: () => void) {
    if (this.isMuted || !this.synth) return;
    this.synth.cancel();

    const cleanText = text.replace(/[•*#_`]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = this.synth.getVoices();
    const narratorVoice = voices.find(
      (v) =>
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural') || v.name.includes('Samantha') || v.name.includes('Guy')) &&
        v.lang.startsWith('en')
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (narratorVoice) {
      utterance.voice = narratorVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
    }

    this.synth.speak(utterance);
  }

  // Speaks dialogue from characters with exact requested neural voices
  public static speakDialogue(characterName: string, text: string, onEnd?: () => void) {
    if (this.isMuted || !this.synth) return;
    this.synth.cancel();

    const cleanText = text.replace(/\{"tension":.*?\}/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const femaleNames = ['pooja', 'sneha', 'ananya', 'sarah', 'chloe'];
    const isFemale = femaleNames.some((name) => characterName.toLowerCase().includes(name));

    const voices = this.synth.getVoices();

    if (isFemale) {
      // 1. EXACT match for Microsoft Neerja Online (Natural) - English (India)
      const neerjaVoice = voices.find((v) =>
        v.name.includes('Neerja') && v.name.includes('Natural')
      ) || voices.find((v) =>
        v.name.includes('Neerja')
      );

      if (neerjaVoice) {
        utterance.voice = neerjaVoice;
      } else {
        // Fallback to other natural female Indian or neural voices if on a different device
        const naturalFemale = voices.find((v) =>
          (v.name.includes('Jenny') || v.name.includes('Aria') || v.name.includes('Samantha') || (v.name.includes('Female') && v.name.includes('Natural'))) &&
          v.lang.startsWith('en')
        );
        if (naturalFemale) utterance.voice = naturalFemale;
      }
    } else {
      // Male character voice - prefers Indian natural male (Prabhat/Ravi) or natural male
      const maleVoice = voices.find((v) =>
        (v.name.includes('Prabhat') || v.name.includes('Ravi')) && v.name.includes('Natural')
      ) || voices.find((v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Guy') || v.name.includes('David') || v.name.includes('George'))
      ) || voices.find((v) => v.name.includes('Google') && v.lang.startsWith('en'));

      if (maleVoice) {
        utterance.voice = maleVoice;
      }
    }

    if (onEnd) {
      utterance.onend = onEnd;
    }

    this.synth.speak(utterance);
  }
}
