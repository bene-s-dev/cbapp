# Supabase & Gemini Setup

To automate daily question generation, follow these steps:

## 1. SQL Migration
Run this in your Supabase SQL Editor:

```sql
-- Create the table for daily questions
CREATE TABLE IF NOT EXISTS public.daily_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_key DATE NOT NULL UNIQUE,
  questions JSONB NOT NULL, -- Stores { tot: Question, ranking: Question, text: Question }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.daily_questions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read daily questions"
  ON public.daily_questions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Enable pg_cron (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the edge function call (adjust URL once deployed)
-- SELECT cron.schedule('generate-daily-questions', '0 3 * * *', $$
--   SELECT net.http_post(
--     url:='https://YOUR_PROJECT_REF.functions.supabase.co/generate-daily-questions',
--     headers:=jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'),
--     body:=jsonb_build_object()
--   );
-- $$);
```

## 2. Supabase Edge Function
Create a new function `generate-daily-questions` and use this code:

```typescript
// supabase/functions/generate-daily-questions/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const dayKey = new Date().toISOString().split('T')[0];

    // Check if questions already exist for today
    const { data: existing } = await supabase
      .from('daily_questions')
      .select('id')
      .eq('day_key', dayKey)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ message: 'Questions already exist for today' }), { status: 200 });
    }

    const prompt = `
      Generiere 3 kreative Fragen für eine Beziehungs-App auf Deutsch.
      Format: JSON.
      
      Erforderliche Typen:
      1. "tot" (This or That): 2 Optionen (z.B. "Pizza" oder "Burger").
      2. "ranking": 4 Optionen zum Sortieren (z.B. Prioritäten oder Reiseziele).
      3. "text": Eine offene Frage zum Reflektieren.

      Struktur:
      {
        "tot": { "q": "Frage", "h": "Kurzer Tipp/Hinweis", "o": ["Option 1", "Option 2"] },
        "ranking": { "q": "Frage", "h": "Kurzer Tipp", "o": ["Sache 1", "Sache 2", "Sache 3", "Sache 4"] },
        "text": { "q": "Frage", "h": "Kurzer Tipp", "o": [] }
      }
      Antworte NUR mit dem reinen JSON.
    `;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const geminiData = await response.json();
    const content = JSON.parse(geminiData.candidates[0].content.parts[0].text);

    const { error: insertError } = await supabase
      .from('daily_questions')
      .insert({
        day_key: dayKey,
        questions: content
      });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ message: 'Questions generated successfully', data: content }), { 
      headers: { 'Content-Type': 'application/json' },
      status: 200 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})
```
