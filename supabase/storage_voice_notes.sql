-- One-time storage setup for voice notes.

insert into storage.buckets (id, name, public)
values ('voice-notes', 'voice-notes', true)
on conflict (id) do nothing;

-- Drop if rerunning.
drop policy if exists "voice_notes_insert_self" on storage.objects;
drop policy if exists "voice_notes_read_all" on storage.objects;

-- Authed users may upload only under their own uid folder.
create policy "voice_notes_insert_self" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'voice-notes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read so <audio src=...> works without signed-URL refresh.
create policy "voice_notes_read_all" on storage.objects
  for select to public
  using (bucket_id = 'voice-notes');
