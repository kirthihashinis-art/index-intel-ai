-- ROLES
CREATE TYPE public.app_role AS ENUM ('user','librarian');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  interests text[] NOT NULL DEFAULT '{}',
  favorite_genres text[] NOT NULL DEFAULT '{}',
  reading_preferences text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'librarian'));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'librarian'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), COALESCE(NEW.email,''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN NEW.email ILIKE '%@shelfai.lib' THEN 'librarian'::public.app_role ELSE 'user'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- SHELVES
CREATE TABLE public.shelves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  shelf_label text NOT NULL UNIQUE,
  rows_count int NOT NULL DEFAULT 4,
  positions_per_row int NOT NULL DEFAULT 12,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shelves TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shelves TO authenticated;
GRANT ALL ON public.shelves TO service_role;
ALTER TABLE public.shelves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shelves_read" ON public.shelves FOR SELECT TO authenticated USING (true);
CREATE POLICY "shelves_write" ON public.shelves FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'librarian')) WITH CHECK (public.has_role(auth.uid(),'librarian'));

-- BOOKS
CREATE TABLE public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_code text NOT NULL UNIQUE,
  isbn text NOT NULL DEFAULT '',
  title text NOT NULL,
  author text NOT NULL,
  genre text NOT NULL,
  description text NOT NULL DEFAULT '',
  cover_url text,
  publication_year int,
  rating numeric(2,1) NOT NULL DEFAULT 4.0,
  total_copies int NOT NULL DEFAULT 1,
  available_copies int NOT NULL DEFAULT 1,
  section text NOT NULL,
  shelf_label text NOT NULL,
  row_no int NOT NULL DEFAULT 1,
  position_no int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "books_read" ON public.books FOR SELECT TO authenticated USING (true);
CREATE POLICY "books_write" ON public.books FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'librarian')) WITH CHECK (public.has_role(auth.uid(),'librarian'));
CREATE TRIGGER books_touch BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX books_search_idx ON public.books USING gin (to_tsvector('english', title || ' ' || author || ' ' || genre));

CREATE TABLE public.book_copies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  copy_label text NOT NULL,
  status text NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book_id, copy_label)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_copies TO authenticated;
GRANT ALL ON public.book_copies TO service_role;
ALTER TABLE public.book_copies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "copies_read" ON public.book_copies FOR SELECT TO authenticated USING (true);
CREATE POLICY "copies_write" ON public.book_copies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'librarian')) WITH CHECK (public.has_role(auth.uid(),'librarian'));

CREATE OR REPLACE FUNCTION public.sync_book_counts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE bid uuid;
BEGIN
  bid := COALESCE(NEW.book_id, OLD.book_id);
  UPDATE public.books b SET
    total_copies = (SELECT count(*) FROM public.book_copies c WHERE c.book_id = bid),
    available_copies = (SELECT count(*) FROM public.book_copies c WHERE c.book_id = bid AND c.status = 'available')
  WHERE b.id = bid;
  RETURN NULL;
END; $$;
CREATE TRIGGER copies_sync AFTER INSERT OR UPDATE OR DELETE ON public.book_copies
  FOR EACH ROW EXECUTE FUNCTION public.sync_book_counts();

-- BORROWINGS
CREATE TABLE public.borrowings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  copy_id uuid NOT NULL REFERENCES public.book_copies(id) ON DELETE CASCADE,
  borrowed_at timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  returned_at timestamptz,
  status text NOT NULL DEFAULT 'borrowed',
  verification text NOT NULL DEFAULT 'none',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.borrowings TO authenticated;
GRANT ALL ON public.borrowings TO service_role;
ALTER TABLE public.borrowings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "borrowings_select" ON public.borrowings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'librarian'));
CREATE POLICY "borrowings_insert_own" ON public.borrowings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "borrowings_update" ON public.borrowings FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'librarian'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'librarian'));
CREATE UNIQUE INDEX borrowings_active_copy_idx ON public.borrowings (copy_id) WHERE status = 'borrowed';

-- USER-SCOPED TABLES
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_own" ON public.favorites FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.search_history TO authenticated;
GRANT ALL ON public.search_history TO service_role;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "search_history_own" ON public.search_history FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query text NOT NULL,
  recommendations jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.ai_recommendations TO authenticated;
GRANT ALL ON public.ai_recommendations TO service_role;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_recs_own" ON public.ai_recommendations FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  recommendation_id uuid REFERENCES public.ai_recommendations(id) ON DELETE SET NULL,
  feedback text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_feedback TO authenticated;
GRANT ALL ON public.ai_feedback TO service_role;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_feedback_own" ON public.ai_feedback FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  queue_position int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reservations_select" ON public.reservations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'librarian'));
CREATE POLICY "reservations_write_own" ON public.reservations FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- LIBRARIAN-ONLY TABLES
CREATE TABLE public.shelf_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  librarian_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shelf_label text NOT NULL DEFAULT '',
  mode text NOT NULL DEFAULT 'ai',
  detected_books jsonb NOT NULL DEFAULT '[]',
  misplaced_books jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shelf_scans TO authenticated;
GRANT ALL ON public.shelf_scans TO service_role;
ALTER TABLE public.shelf_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shelf_scans_librarian" ON public.shelf_scans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'librarian')) WITH CHECK (public.has_role(auth.uid(),'librarian'));

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text NOT NULL DEFAULT '',
  action text NOT NULL,
  target text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_select_librarian" ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'librarian'));
CREATE POLICY "audit_insert_librarian" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'librarian'));

-- SEED SHELVES
INSERT INTO public.shelves (section, shelf_label, rows_count, positions_per_row, description) VALUES
 ('A','A-01',4,12,'Fiction — classics'),
 ('A','A-02',4,12,'Fiction — contemporary'),
 ('A','A-03',4,12,'Fiction — bestsellers'),
 ('B','B-01',4,12,'Mystery'),
 ('B','B-02',4,12,'Thriller'),
 ('B','B-04',4,12,'Mystery — detective'),
 ('C','C-01',5,10,'Science'),
 ('C','C-02',5,10,'Technology'),
 ('C','C-03',5,10,'Programming'),
 ('D','D-01',4,12,'Self development'),
 ('D','D-02',4,12,'History'),
 ('D','D-03',4,12,'Non-fiction');

-- SEED BOOKS
INSERT INTO public.books (book_code,isbn,title,author,genre,description,publication_year,rating,section,shelf_label,row_no,position_no,total_copies,available_copies) VALUES
('BK001','9780061122415','The Alchemist','Paulo Coelho','Fiction','A shepherd boy travels from Spain to Egypt in search of treasure and finds his destiny.',1988,4.6,'A','A-03',2,7,3,3),
('BK002','9780062315007','Life of Pi','Yann Martel','Fiction','A boy survives a shipwreck adrift with a Bengal tiger.',2001,4.3,'A','A-02',1,4,2,2),
('BK003','9780316769488','The Catcher in the Rye','J.D. Salinger','Fiction','Holden Caulfield wanders New York after leaving prep school.',1951,4.0,'A','A-01',3,2,2,1),
('BK004','9780743273565','The Great Gatsby','F. Scott Fitzgerald','Fiction','Jay Gatsby chases a dream across Long Island.',1925,4.2,'A','A-01',1,1,2,2),
('BK005','9780439708180','Harry Potter and the Sorcerer''s Stone','J.K. Rowling','Fiction','A boy discovers he is a wizard and enters Hogwarts.',1997,4.8,'A','A-03',1,3,4,2),
('BK006','9780307474278','The Da Vinci Code','Dan Brown','Thriller','A symbologist unravels a conspiracy hidden in art.',2003,4.1,'B','B-02',2,5,3,1),
('BK007','9780316055437','Gone Girl','Gillian Flynn','Thriller','A wife disappears and her husband becomes the prime suspect.',2012,4.2,'B','B-02',1,2,2,2),
('BK008','9781402894060','The Hound of the Baskervilles','Arthur Conan Doyle','Mystery','Sherlock Holmes investigates a spectral hound on the moors.',1902,4.5,'B','B-04',2,7,3,3),
('BK009','9780062073488','Murder on the Orient Express','Agatha Christie','Mystery','Poirot solves a murder aboard a snowbound train.',1934,4.6,'B','B-01',2,3,3,2),
('BK010','9780307588371','The Girl with the Dragon Tattoo','Stieg Larsson','Mystery','A journalist and a hacker dig into a decades-old disappearance.',2005,4.3,'B','B-01',3,6,2,1),
('BK011','9780553380163','A Brief History of Time','Stephen Hawking','Science','A tour of cosmology from the big bang to black holes.',1988,4.5,'C','C-01',1,2,3,3),
('BK012','9780393609394','Astrophysics for People in a Hurry','Neil deGrasse Tyson','Science','A compact guide to the cosmos.',2017,4.4,'C','C-01',2,5,2,2),
('BK013','9780198788607','The Selfish Gene','Richard Dawkins','Science','Evolution seen from the gene''s point of view.',1976,4.3,'C','C-01',3,1,2,1),
('BK014','9780262033848','Introduction to Algorithms','Thomas H. Cormen','Programming','The comprehensive reference on algorithms and data structures.',2009,4.7,'C','C-03',2,4,3,2),
('BK015','9781593279288','Python Crash Course','Eric Matthes','Programming','A hands-on, beginner-friendly introduction to Python.',2019,4.6,'C','C-03',1,1,4,4),
('BK016','9780132350884','Clean Code','Robert C. Martin','Programming','Principles and practices for writing maintainable software.',2008,4.5,'C','C-03',3,8,3,2),
('BK017','9781491954621','Fluent Python','Luciano Ramalho','Programming','Idiomatic Python for experienced developers.',2015,4.6,'C','C-03',4,2,2,2),
('BK018','9780201616224','The Pragmatic Programmer','Andrew Hunt','Programming','Practical wisdom for the working developer.',1999,4.6,'C','C-03',2,9,2,1),
('BK019','9781119644682','Artificial Intelligence Basics','Tom Taulli','Technology','A non-technical introduction to AI and machine learning.',2019,4.0,'C','C-02',1,3,2,2),
('BK020','9780593076927','Life 3.0','Max Tegmark','Technology','Being human in the age of artificial intelligence.',2017,4.2,'C','C-02',2,6,2,2),
('BK021','9781941691090','The Phoenix Project','Gene Kim','Technology','A novel about IT, DevOps and business transformation.',2013,4.4,'C','C-02',3,1,2,1),
('BK022','9780735211292','Atomic Habits','James Clear','Self Development','Tiny changes that build remarkable results.',2018,4.8,'D','D-01',1,5,4,3),
('BK023','9781847941831','Deep Work','Cal Newport','Self Development','Rules for focused success in a distracted world.',2016,4.5,'D','D-01',2,2,3,3),
('BK024','9780743269513','The 7 Habits of Highly Effective People','Stephen R. Covey','Self Development','A principle-centred approach to personal effectiveness.',1989,4.4,'D','D-01',3,7,2,1),
('BK025','9780062641540','Mindset','Carol S. Dweck','Self Development','How a growth mindset shapes achievement.',2006,4.3,'D','D-01',4,4,2,2),
('BK026','9780062316097','Sapiens','Yuval Noah Harari','History','A sweeping history of humankind.',2011,4.7,'D','D-02',1,1,4,3),
('BK027','9780679745587','SPQR: A History of Ancient Rome','Mary Beard','History','A fresh account of Rome''s thousand-year rise.',2015,4.2,'D','D-02',2,8,2,2),
('BK028','9780307887436','The Guns of August','Barbara W. Tuchman','History','The outbreak of the First World War, month by month.',1962,4.3,'D','D-02',3,3,2,1),
('BK029','9780374533557','Thinking, Fast and Slow','Daniel Kahneman','Non-Fiction','How two systems of thought drive our judgement.',2011,4.5,'D','D-03',1,2,3,3),
('BK030','9780385537859','Educated','Tara Westover','Non-Fiction','A memoir of a girl who leaves her survivalist family for university.',2018,4.6,'D','D-03',2,6,2,2);

-- SEED COPIES (matching each book's seeded availability state)
INSERT INTO public.book_copies (book_id, copy_label, status)
SELECT b.id, b.book_code || '-C' || g,
       CASE WHEN g <= b.available_copies THEN 'available'
            WHEN g = b.available_copies + 1 AND b.total_copies - b.available_copies > 1 THEN 'reserved'
            ELSE 'borrowed' END
FROM public.books b, generate_series(1, 4) g
WHERE g <= b.total_copies;