// src/types/index.ts
export type Character = {
  id: string;
  user_id: string;
  name: string;
  world: string;
  vocation: 'druid' | 'knight' | 'paladin' | 'sorcerer';
  category: string;
  created_at?: string;
};

export type XPLog = {
  id: string;
  character_id: string; // ← NÃO tem character_name
  date: string;
  level: number;
  xp: number;
  created_at?: string;
};