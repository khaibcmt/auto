export type TabType =
  | 'humanizer'
  | 'autotyper'
  | 'lesson5512'
  | 'examsuite'
  | 'mediastudio'
  | 'prose'
  | 'models'
  | 'desktop'
  | 'logs';

export type Language = 'vi' | 'en';

export interface AppLog {
  id: string;
  timestamp: string;
  level: 'info' | 'hotkey' | 'engine' | 'warning' | 'error';
  message: string;
}

export interface UserSettings {
  delayMin: number;
  delayMax: number;
  hotkeyWait: number;
  typoRate: number;
  isHuman: boolean;
  soundEnabled: boolean;
  soundProfile: 'clicky' | 'thocky' | 'silent';
  soundVolume: number;
  provider: string;
  model: string;
  strength: 'subtle' | 'standard' | 'strong';
  soProfileId: string;
  ollamaHost: string;
  customPrompt: string;
  language: Language;
}
