-- ==========================================
-- 1. TABLES
-- ==========================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  partner_id UUID REFERENCES public.profiles(id),
  partner_code TEXT UNIQUE,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ANSWERS
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  day_key DATE NOT NULL,
  choice TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, day_key)
);

-- DAILY_QUESTIONS
CREATE TABLE IF NOT EXISTS public.daily_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_key DATE NOT NULL UNIQUE,
  questions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. ENABLE RLS
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_questions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their partner's profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own answers" ON public.answers;
DROP POLICY IF EXISTS "Users can view their partner's answers" ON public.answers;
DROP POLICY IF EXISTS "Users can insert their own answers" ON public.answers;
DROP POLICY IF EXISTS "Users can delete their own answers" ON public.answers;

CREATE POLICY "Users can view their own answers" ON public.answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their partner's answers" ON public.answers FOR SELECT USING (user_id IN (SELECT partner_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert their own answers" ON public.answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own answers" ON public.answers FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow authenticated users to read daily questions" ON public.daily_questions;
CREATE POLICY "Allow authenticated users to read daily questions" ON public.daily_questions FOR SELECT USING (auth.role() = 'authenticated');

-- ==========================================
-- 4. RPC FUNCTIONS
-- ==========================================

-- Function to link partners atomically
CREATE OR REPLACE FUNCTION public.link_partners(partner_code_to_link TEXT)
RETURNS VOID AS $$
DECLARE
    partner_id_found UUID;
BEGIN
    -- 1. Find the partner
    SELECT id INTO partner_id_found
    FROM public.profiles
    WHERE partner_code = upper(trim(partner_code_to_link));

    IF partner_id_found IS NULL THEN
        RAISE EXCEPTION 'Code nicht gefunden!';
    END IF;

    IF partner_id_found = auth.uid() THEN
        RAISE EXCEPTION 'Du kannst dich nicht mit dir selbst verknüpfen!';
    END IF;

    -- 2. Update both profiles
    UPDATE public.profiles
    SET partner_id = partner_id_found
    WHERE id = auth.uid();

    UPDATE public.profiles
    SET partner_id = auth.uid()
    WHERE id = partner_id_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlink partners atomically
CREATE OR REPLACE FUNCTION public.unlink_partners()
RETURNS VOID AS $$
DECLARE
    current_partner_id UUID;
BEGIN
    -- 1. Get current partner
    SELECT partner_id INTO current_partner_id
    FROM public.profiles
    WHERE id = auth.uid();

    IF current_partner_id IS NOT NULL THEN
        -- 2. Set both to NULL
        UPDATE public.profiles
        SET partner_id = NULL
        WHERE id = auth.uid();

        UPDATE public.profiles
        SET partner_id = NULL
        WHERE id = current_partner_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. STORAGE (AVATARS)
-- ==========================================
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ==========================================
-- 5. AUTH TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, partner_code)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'display_name',
    'CB-' || upper(substring(new.id::text from 1 for 6))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 6. EDGE FUNCTION CODE (Copy this to Supabase)
-- ==========================================
/*
-- Name: generate-daily-questions
-- Code:
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  // Get dayKey from request body or fallback to current UTC date
  let dayKey;
  try {
    const body = await req.json();
    dayKey = body.dayKey;
  } catch (e) {
    dayKey = new Date().toISOString().split('T')[0];
  }

  try {    // Check existing
    const { data: existing } = await supabase.from('daily_questions').select('questions').eq('day_key', dayKey).maybeSingle();
    if (existing) return new Response(JSON.stringify(existing), { headers: { 'Content-Type': 'application/json' } });

    // Generate AI
    const prompt = "Generiere 3 kreative Fragen für eine Beziehungs-App auf Deutsch. Format: JSON. Typen: 1. 'tot' (2 Optionen), 2. 'ranking' (4 Optionen), 3. 'text' (offen). Struktur: { tot: { q, h, o:[] }, ranking: { q, h, o:[] }, text: { q, h, o:[] } }";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { response_mime_type: "application/json" } })
    });
    const geminiData = await res.json();
    const content = JSON.parse(geminiData.candidates[0].content.parts[0].text);

    // Save
    await supabase.from('daily_questions').insert({ day_key: dayKey, questions: content });
    return new Response(JSON.stringify({ questions: content }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
})
*/

-- STREAKS
CREATE TABLE IF NOT EXISTS public.streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_answer_date DATE,
  streak_history JSONB DEFAULT '[]'::jsonb, -- Array of dates where the streak was active
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streak" ON public.streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their partner's streak" ON public.streaks FOR SELECT USING (user_id IN (SELECT partner_id FROM public.profiles WHERE id = auth.uid()));

-- Function to update streak on answer
CREATE OR REPLACE FUNCTION public.update_streak()
RETURNS TRIGGER AS $$
DECLARE
    today DATE;
    yesterday DATE;
    current_s INTEGER;
    last_d DATE;
BEGIN
    today := NEW.day_key;
    yesterday := today - INTERVAL '1 day';
    
    SELECT current_streak, last_answer_date INTO current_s, last_d
    FROM public.streaks
    WHERE user_id = NEW.user_id;
    
    IF NOT FOUND THEN
        INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_answer_date, streak_history)
        VALUES (NEW.user_id, 1, 1, today, jsonb_build_array(today));
    ELSE
        IF last_d = today THEN
            -- Already answered today, do nothing
            RETURN NEW;
        ELSIF last_d = yesterday THEN
            -- Continued streak
            UPDATE public.streaks
            SET current_streak = current_s + 1,
                longest_streak = GREATEST(longest_streak, current_s + 1),
                last_answer_date = today,
                streak_history = streak_history || jsonb_build_array(today)
            WHERE user_id = NEW.user_id;
        ELSE
            -- Streak broken
            UPDATE public.streaks
            SET current_streak = 1,
                last_answer_date = today,
                streak_history = jsonb_build_array(today)
            WHERE user_id = NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_answer_update_streak
  AFTER INSERT ON public.answers
  FOR EACH ROW EXECUTE FUNCTION public.update_streak();

-- PUSH SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Note: Sending push notifications requires a server-side component (Edge Function)
-- that uses the VAPID keys to send messages to the browser's push service.
