import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface EmailPreferences {
  reminder_enabled: boolean;
  frequency: 'daily' | 'weekly';
}

export const useEmailPreferences = () => {
  const [preferences, setPreferences] = useState<EmailPreferences>({
    reminder_enabled: false,
    frequency: 'weekly',
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        await loadPreferences(session.user.id);
      }
      setLoading(false);
    };
    init();
  }, []);

  const loadPreferences = async (uid: string) => {
    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', uid)
      .single();

    if (data && !error) {
      setPreferences({
        reminder_enabled: data.reminder_enabled,
        frequency: data.frequency,
      });
    }
  };

  const toggleReminder = async (enabled: boolean) => {
    if (!userId) return;

    const { error } = await supabase
      .from('email_preferences')
      .upsert({
        user_id: userId,
        reminder_enabled: enabled,
        frequency: preferences.frequency,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (!error) {
      setPreferences(prev => ({ ...prev, reminder_enabled: enabled }));
    }
    return { error };
  };

  const setFrequency = async (frequency: 'daily' | 'weekly') => {
    if (!userId) return;

    const { error } = await supabase
      .from('email_preferences')
      .upsert({
        user_id: userId,
        reminder_enabled: preferences.reminder_enabled,
        frequency,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (!error) {
      setPreferences(prev => ({ ...prev, frequency }));
    }
    return { error };
  };

  return {
    preferences,
    loading,
    toggleReminder,
    setFrequency,
  };
};
