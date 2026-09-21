-- Enums
CREATE TYPE public.project_status AS ENUM ('in_progress','on_hold','completed');
CREATE TYPE public.account_type AS ENUM ('cash','bank');
CREATE TYPE public.expense_main_category AS ENUM ('materials','wages','services','operations');
CREATE TYPE public.party_type AS ENUM ('worker','supplier','other');

-- Helper: updated_at trigger
CREATE OR REPLACE FUNCTION public.set_audit_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
    NEW.updated_by := COALESCE(NEW.updated_by, auth.uid());
  ELSE
    NEW.updated_at := now();
    NEW.updated_by := COALESCE(auth.uid(), NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$$;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PROJECTS
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client_name text,
  address text,
  code text,
  start_date date,
  expected_end_date date,
  budget numeric(14,2) NOT NULL DEFAULT 0,
  description text,
  status public.project_status NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE public.project_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  estimated_cost numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type public.account_type NOT NULL DEFAULT 'cash',
  opening_balance numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  main_category public.expense_main_category NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  UNIQUE (main_category, name)
);

CREATE TABLE public.workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  profession text,
  phone text,
  wage_type text,
  agreed_wage numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  receipt_date date NOT NULL DEFAULT CURRENT_DATE,
  payer text,
  method text,
  payment_no text,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  notes text,
  attachment_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  project_item_id uuid REFERENCES public.project_items(id) ON DELETE SET NULL,
  total_amount numeric(14,2) NOT NULL CHECK (total_amount >= 0),
  paid_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  main_category public.expense_main_category NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  party_type public.party_type NOT NULL DEFAULT 'other',
  worker_id uuid REFERENCES public.workers(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  beneficiary_name text,
  payment_method text,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  invoice_no text,
  description text,
  notes text,
  attachment_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);
ALTER TABLE public.expenses ADD CONSTRAINT paid_not_more_than_total CHECK (paid_amount <= total_amount);

-- worker advances (سلف) : cash out now, settled later against dues, not an expense
CREATE TABLE public.worker_advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  settled_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (settled_amount >= 0),
  advance_date date NOT NULL DEFAULT CURRENT_DATE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  notes text,
  attachment_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- payments to creditors (settling outstanding dues of suppliers/workers)
CREATE TABLE public.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_type public.party_type NOT NULL,
  worker_id uuid REFERENCES public.workers(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  settlement_date date NOT NULL DEFAULT CURRENT_DATE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  uses_advance boolean NOT NULL DEFAULT false,
  notes text,
  attachment_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- Grants, RLS, policies, triggers for all business tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['projects','project_items','accounts','categories','workers','suppliers','receipts','expenses','worker_advances','settlements']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE POLICY "authenticated full access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', t);
    EXECUTE format('CREATE TRIGGER audit_%I BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();', t, t);
  END LOOP;
END $$;

CREATE INDEX ON public.expenses (project_id);
CREATE INDEX ON public.expenses (expense_date);
CREATE INDEX ON public.receipts (project_id);
CREATE INDEX ON public.project_items (project_id);

-- Seed accounts and categories
INSERT INTO public.accounts (name, type, opening_balance) VALUES
  ('الصندوق النقدي','cash',0),
  ('البنك','bank',0);

INSERT INTO public.categories (main_category, name) VALUES
  ('materials','بلاط'),('materials','إسمنت'),('materials','رمل'),('materials','دهان'),
  ('materials','جبس'),('materials','أدوات صحية'),('materials','مواد كهربائية'),('materials','ألواح طاقة'),
  ('wages','مبلط'),('wages','دهان'),('wages','كهربائي'),('wages','سباك'),('wages','نجار'),('wages','عامل'),
  ('services','نقل'),('services','ترحيل مخلفات'),('services','تنظيف'),('services','تحميل وتنزيل'),('services','استئجار معدات'),
  ('operations','وقود'),('operations','مواصلات'),('operations','هاتف'),('operations','مياه'),('operations','كهرباء'),('operations','مصروف يومي'),('operations','طوارئ');
