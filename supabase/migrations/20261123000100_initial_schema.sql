
-- ============================================
-- CAMPUSRECOVER
-- Initial Database Schema
-- ============================================

-- 1. ENUM TYPES

CREATE TYPE public.user_role AS ENUM (
  'student',
  'security',
  'admin'
);

CREATE TYPE public.report_type AS ENUM (
  'lost',
  'found'
);

CREATE TYPE public.report_status AS ENUM (
  'open',
  'under_review',
  'matched',
  'resolved',
  'closed'
);

CREATE TYPE public.claim_status AS ENUM (
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'disputed',
  'resolved',
  'withdrawn'
);

CREATE TYPE public.match_status AS ENUM (
  'pending',
  'confirmed',
  'dismissed'
);

-- 2. PROFILES

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id)
    ON DELETE CASCADE,

  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  student_id TEXT UNIQUE,
  department TEXT,
  batch TEXT,
  avatar_url TEXT,

  role public.user_role NOT NULL DEFAULT 'student',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES

CREATE TABLE public.categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LOCATIONS

CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  building TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ITEM REPORTS

CREATE TABLE public.item_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  reporter_id UUID NOT NULL
    REFERENCES public.profiles(id),

  category_id BIGINT REFERENCES public.categories(id),
  location_id UUID REFERENCES public.locations(id),

  report_type public.report_type NOT NULL,

  title TEXT NOT NULL,
  description TEXT NOT NULL,

  incident_at TIMESTAMPTZ,

  status public.report_status NOT NULL DEFAULT 'open',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 6. CLAIMS

CREATE TABLE public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  report_id UUID NOT NULL
    REFERENCES public.item_reports(id),

  claimant_id UUID NOT NULL
    REFERENCES public.profiles(id),

  details TEXT NOT NULL,

  status public.claim_status NOT NULL DEFAULT 'submitted',

  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(report_id, claimant_id)
);

-- 7. MATCHES

CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  lost_report_id UUID NOT NULL
    REFERENCES public.item_reports(id),

  found_report_id UUID NOT NULL
    REFERENCES public.item_reports(id),

  match_score NUMERIC(5,2) NOT NULL
    CHECK (match_score BETWEEN 0 AND 100),

  score_factors JSONB NOT NULL DEFAULT '{}'::JSONB,

  status public.match_status NOT NULL DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(lost_report_id, found_report_id),

  CHECK (lost_report_id <> found_report_id)
);

-- 8. NOTIFICATIONS

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  message TEXT NOT NULL,

  notification_type TEXT NOT NULL DEFAULT 'general',
  link TEXT,

  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AUDIT LOGS

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  actor_id UUID REFERENCES public.profiles(id),

  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,

  metadata JSONB DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_reports_reporter
ON public.item_reports(reporter_id);

CREATE INDEX idx_reports_type_status
ON public.item_reports(report_type, status);

CREATE INDEX idx_reports_category
ON public.item_reports(category_id);

CREATE INDEX idx_reports_location
ON public.item_reports(location_id);

CREATE INDEX idx_claims_report
ON public.claims(report_id);

CREATE INDEX idx_claims_claimant
ON public.claims(claimant_id);

CREATE INDEX idx_claims_status
ON public.claims(status);

CREATE INDEX idx_matches_lost
ON public.matches(lost_report_id);

CREATE INDEX idx_matches_found
ON public.matches(found_report_id);

CREATE INDEX idx_notifications_user
ON public.notifications(user_id, is_read);

CREATE INDEX idx_audit_logs_created
ON public.audit_logs(created_at DESC);

-- ============================================
-- AUTOMATIC PROFILE CREATION
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
      SPLIT_PART(NEW.email, '@', 1)
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROLE HELPER
-- ============================================

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('security', 'admin')
  );
$$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES

CREATE POLICY "Users view their own profile or staff"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (SELECT public.is_staff())
);

CREATE POLICY "Users update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

-- CATEGORIES

CREATE POLICY "Authenticated users view categories"
ON public.categories
FOR SELECT
TO authenticated
USING (is_active = TRUE OR (SELECT public.is_staff()));

CREATE POLICY "Staff manage categories"
ON public.categories
FOR ALL
TO authenticated
USING ((SELECT public.is_staff()))
WITH CHECK ((SELECT public.is_staff()));

-- LOCATIONS

CREATE POLICY "Authenticated users view locations"
ON public.locations
FOR SELECT
TO authenticated
USING (is_active = TRUE OR (SELECT public.is_staff()));

CREATE POLICY "Staff manage locations"
ON public.locations
FOR ALL
TO authenticated
USING ((SELECT public.is_staff()))
WITH CHECK ((SELECT public.is_staff()));

-- ITEM REPORTS

CREATE POLICY "Authenticated users browse reports"
ON public.item_reports
FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Users create their own reports"
ON public.item_reports
FOR INSERT
TO authenticated
WITH CHECK (
  reporter_id = (SELECT auth.uid())
  AND status = 'open'
);

CREATE POLICY "Owners and staff update reports"
ON public.item_reports
FOR UPDATE
TO authenticated
USING (
  reporter_id = (SELECT auth.uid())
  OR (SELECT public.is_staff())
)
WITH CHECK (
  reporter_id = (SELECT auth.uid())
  OR (SELECT public.is_staff())
);

-- CLAIMS

CREATE POLICY "Claimants owners and staff view claims"
ON public.claims
FOR SELECT
TO authenticated
USING (
  claimant_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.item_reports r
    WHERE r.id = report_id
      AND r.reporter_id = (SELECT auth.uid())
  )
  OR (SELECT public.is_staff())
);

CREATE POLICY "Users submit claims on found reports"
ON public.claims
FOR INSERT
TO authenticated
WITH CHECK (
  claimant_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.item_reports r
    WHERE r.id = report_id
      AND r.report_type = 'found'
      AND r.status = 'open'
      AND r.reporter_id <> (SELECT auth.uid())
  )
);

-- MATCHES

CREATE POLICY "Relevant users and staff view matches"
ON public.matches
FOR SELECT
TO authenticated
USING (
  (SELECT public.is_staff())
  OR EXISTS (
    SELECT 1
    FROM public.item_reports r
    WHERE r.id IN (lost_report_id, found_report_id)
      AND r.reporter_id = (SELECT auth.uid())
  )
);

-- No client-side INSERT/UPDATE/DELETE policies
-- for matches. Matching writes will use a
-- trusted server-side process.

-- NOTIFICATIONS

CREATE POLICY "Users view their notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users update their notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- AUDIT LOGS

CREATE POLICY "Staff view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING ((SELECT public.is_staff()));

-- No client-side audit log INSERT/UPDATE/DELETE
-- policies. Audit entries will be written through
-- trusted server-side operations.

-- ============================================
-- INITIAL ITEM CATEGORIES
-- ============================================

INSERT INTO public.categories (name, description)
VALUES
  ('Electronics', 'Phones, laptops, chargers and accessories'),
  ('Documents', 'ID cards, certificates and academic documents'),
  ('Bags', 'Backpacks, handbags and wallets'),
  ('Clothing', 'Clothes, jackets and personal accessories'),
  ('Books & Stationery', 'Books, notebooks and writing materials'),
  ('Keys', 'Keys and keychains'),
  ('Personal Items', 'Other personal belongings'),
  ('Other', 'Items that do not fit other categories');

-- ============================================
-- SCHEMA CREATED
-- ============================================
