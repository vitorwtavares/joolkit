-- ── applications ─────────────────────────────────────────────────────────────
-- Notes are now stored as markdown text instead of Tiptap JSON
ALTER TABLE public.applications
  ALTER COLUMN notes TYPE text USING NULL;
