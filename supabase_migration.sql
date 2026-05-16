-- 1. Trigger-Funktion aktualisieren (partner_name entfernen)
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

-- 2. Die Spalte partner_name aus der Tabelle löschen (da sie jetzt redundant ist)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS partner_name;
