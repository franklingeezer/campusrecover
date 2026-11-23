
-- CampusRecover: Registration profile requirements

-- 1. Require a student ID for every profile.
ALTER TABLE public.profiles
ALTER COLUMN student_id SET NOT NULL;

-- 2. Enforce the DIU email domain at database level.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_diu_email_check'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_diu_email_check
    CHECK (lower(email) ~ '^[^@]+@diu\.edu\.bd$');
  END IF;
END $$;

-- 3. Update automatic profile creation.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_name TEXT;
  user_student_id TEXT;
BEGIN
  -- Only DIU email addresses are permitted.
  IF lower(COALESCE(NEW.email, '')) !~ '^[^@]+@diu\.edu\.bd$' THEN
    RAISE EXCEPTION 'Only @diu.edu.bd email addresses are allowed';
  END IF;

  user_name := NULLIF(
    TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''
  );

  user_student_id := NULLIF(
    TRIM(NEW.raw_user_meta_data ->> 'student_id'), ''
  );

  IF user_name IS NULL THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;

  IF user_student_id IS NULL THEN
    RAISE EXCEPTION 'Student ID is required';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    student_id
  )
  VALUES (
    NEW.id,
    lower(NEW.email),
    user_name,
    user_student_id
  );

  RETURN NEW;
END;
$$;
