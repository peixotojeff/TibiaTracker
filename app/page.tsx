// src/app/page.tsx
'use client'; // ←←← ADICIONE ESSA LINHA

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { XPLog } from '@/types';

export default function HomePage() {
  const [logs, setLogs] = useState<XPLog[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('xp_logs')
        .select('*')
        .order('date', { ascending: false });

      if (error) console.error(error);
      else setLogs(data || []);
    };

    fetchLogs();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Tibia Tracker</h1>
      <ul className="space-y-2">
        {logs.map((log) => (
          <li key={log.id} className="border p-3 rounded">
            <strong>{log.character_name}</strong>: {log.xp.toLocaleString()} XP em {log.date}
          </li>
        ))}
      </ul>
    </div>
  );
}