-- 1. Remove debug tables
DROP TABLE IF EXISTS public.trigger_debug_logs;

-- 2. Remove old SQL-based notification triggers
DROP TRIGGER IF EXISTS on_answer_notify ON public.answers;
DROP FUNCTION IF EXISTS public.notify_partner_on_answer();

-- 3. Optional: Remove any leftover test answers from our diagnostics
DELETE FROM public.answers WHERE choice = 'Diagnose Test' OR choice = 'Finaler Test' OR choice LIKE 'Test Update%';

-- Note: We keep the streaks trigger as it is separate and working.
