
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  telefone text NOT NULL DEFAULT '',
  aceite_termos_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Ver os próprios papéis" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Ver o próprio perfil" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Editar o próprio perfil" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'inactive',
  current_period_end timestamptz,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  acesso_manual boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver a própria assinatura" ON public.subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins gerenciam assinaturas" ON public.subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.has_active_access(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin') OR EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = _user_id
      AND (
        s.acesso_manual
        OR (s.status IN ('active', 'trialing') AND (s.current_period_end IS NULL OR s.current_period_end > now()))
      )
  )
$$;

-- TRACKS
CREATE TABLE public.tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  cover_url text,
  position integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  is_sample boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracks TO authenticated;
GRANT ALL ON public.tracks TO service_role;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Membros veem trilhas publicadas" ON public.tracks FOR SELECT TO authenticated
  USING (published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins gerenciam trilhas" ON public.tracks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- LESSONS (metadata only; video lives in lesson_media)
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  thumbnail_url text,
  duration_seconds integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  is_free_preview boolean NOT NULL DEFAULT false,
  is_sample boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lessons_track_position_idx ON public.lessons(track_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Membros veem aulas publicadas" ON public.lessons FOR SELECT TO authenticated
  USING (published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins gerenciam aulas" ON public.lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- LESSON MEDIA (gated)
CREATE TABLE public.lesson_media (
  lesson_id uuid PRIMARY KEY REFERENCES public.lessons(id) ON DELETE CASCADE,
  source_type text NOT NULL DEFAULT 'youtube' CHECK (source_type IN ('upload', 'youtube')),
  video_path text,
  youtube_url text,
  materials jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_media TO authenticated;
GRANT ALL ON public.lesson_media TO service_role;
ALTER TABLE public.lesson_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vídeo só para quem tem acesso" ON public.lesson_media FOR SELECT TO authenticated
  USING (
    public.has_active_access(auth.uid())
    OR EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.published AND l.is_free_preview)
  );
CREATE POLICY "Admins gerenciam vídeos" ON public.lesson_media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- LESSON PROGRESS
CREATE TABLE public.lesson_progress (
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  progress_percent integer NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver o próprio progresso" ON public.lesson_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Registrar o próprio progresso" ON public.lesson_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Atualizar o próprio progresso" ON public.lesson_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Apagar o próprio progresso" ON public.lesson_progress FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER subscriptions_touch BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER tracks_touch BEFORE UPDATE ON public.tracks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER lessons_touch BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER lesson_media_touch BEFORE UPDATE ON public.lesson_media FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER lesson_progress_touch BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- New user: profile + member role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, telefone, aceite_termos_em)
  VALUES (
    NEW.id,
    left(coalesce(NEW.raw_user_meta_data->>'nome', ''), 120),
    coalesce(NEW.email, ''),
    left(coalesce(NEW.raw_user_meta_data->>'telefone', ''), 20),
    CASE WHEN NEW.raw_user_meta_data->>'aceite_termos' = 'true' THEN now() ELSE NULL END
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SAMPLE DATA (EXEMPLO)
INSERT INTO public.tracks (id, title, description, cover_url, position, is_sample) VALUES
 ('11111111-0000-4000-8000-000000000001', 'Exemplo · Fundamentos do negócio', 'Trilha de exemplo: primeiros passos para organizar seu negócio.', '/images/exemplo/trilha-fundamentos.jpg', 1, true),
 ('11111111-0000-4000-8000-000000000002', 'Exemplo · Finanças para MEI', 'Trilha de exemplo: controle de caixa, precificação e impostos.', '/images/exemplo/trilha-financas.jpg', 2, true),
 ('11111111-0000-4000-8000-000000000003', 'Exemplo · Vendas e marketing', 'Trilha de exemplo: como atrair e atender clientes.', '/images/exemplo/trilha-vendas.jpg', 3, true);

INSERT INTO public.lessons (id, track_id, title, description, thumbnail_url, duration_seconds, position, published, is_free_preview, is_sample) VALUES
 ('22222222-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', 'Aula de exemplo 1 · Boas-vindas', 'Conteúdo de exemplo. O administrador substituirá esta aula pelo vídeo real.', '/images/exemplo/trilha-fundamentos.jpg', 540, 1, true, true, true),
 ('22222222-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000001', 'Aula de exemplo 2 · Definindo seu cliente', 'Conteúdo de exemplo.', '/images/exemplo/trilha-fundamentos.jpg', 1260, 2, true, false, true),
 ('22222222-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000001', 'Aula de exemplo 3 · Organizando a rotina', 'Conteúdo de exemplo.', '/images/exemplo/trilha-fundamentos.jpg', 980, 3, true, false, true),
 ('22222222-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000002', 'Aula de exemplo 1 · Separando contas', 'Conteúdo de exemplo.', '/images/exemplo/trilha-financas.jpg', 720, 1, true, true, true),
 ('22222222-0000-4000-8000-000000000005', '11111111-0000-4000-8000-000000000002', 'Aula de exemplo 2 · Fluxo de caixa', 'Conteúdo de exemplo.', '/images/exemplo/trilha-financas.jpg', 1500, 2, true, false, true),
 ('22222222-0000-4000-8000-000000000006', '11111111-0000-4000-8000-000000000002', 'Aula de exemplo 3 · Precificação', 'Conteúdo de exemplo.', '/images/exemplo/trilha-financas.jpg', 1320, 3, true, false, true),
 ('22222222-0000-4000-8000-000000000007', '11111111-0000-4000-8000-000000000003', 'Aula de exemplo 1 · Proposta de valor', 'Conteúdo de exemplo.', '/images/exemplo/trilha-vendas.jpg', 840, 1, true, false, true),
 ('22222222-0000-4000-8000-000000000008', '11111111-0000-4000-8000-000000000003', 'Aula de exemplo 2 · Atendimento', 'Conteúdo de exemplo.', '/images/exemplo/trilha-vendas.jpg', 1080, 2, true, false, true),
 ('22222222-0000-4000-8000-000000000009', '11111111-0000-4000-8000-000000000003', 'Aula de exemplo 3 · Redes sociais', 'Conteúdo de exemplo.', '/images/exemplo/trilha-vendas.jpg', 1620, 3, true, false, true);

INSERT INTO public.lesson_media (lesson_id, source_type)
SELECT id, 'youtube' FROM public.lessons WHERE is_sample;
