drop policy if exists "Capas leitura autenticada" on storage.objects;
drop policy if exists "Capas públicas leitura" on storage.objects;

create policy "Capas leitura de conteúdo publicado" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'capas' and (
      public.has_role(auth.uid(), 'admin')
      or exists (select 1 from public.tracks t where t.published and t.cover_url = storage.objects.name)
      or exists (select 1 from public.lessons l where l.published and l.thumbnail_url = storage.objects.name)
      or exists (select 1 from public.products p where p.active and p.cover_url = storage.objects.name)
    )
  );