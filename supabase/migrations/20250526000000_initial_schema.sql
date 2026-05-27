-- ResumeBoost initial schema
-- Apply: supabase db push | supabase db reset

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- profiles (extends auth.users)
-- =============================================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
    optimizations_used INT NOT NULL DEFAULT 0,
    optimizations_limit INT NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- resumes
-- =============================================================================
CREATE TABLE public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    source_filename TEXT,
    source_mime TEXT,
    storage_path TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resumes_user_created ON public.resumes (user_id, created_at DESC);

-- =============================================================================
-- resume_versions
-- =============================================================================
CREATE TABLE public.resume_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
    version_type TEXT NOT NULL CHECK (version_type IN ('original', 'optimized')),
    raw_text TEXT,
    structured_content JSONB,
    extraction_metadata JSONB,
    optimization_job_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resume_versions_resume ON public.resume_versions (resume_id, version_type, created_at DESC);

-- =============================================================================
-- job_descriptions
-- =============================================================================
CREATE TABLE public.job_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    content_hash TEXT,
    parsed_analysis JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_descriptions_user_hash ON public.job_descriptions (user_id, content_hash);

-- =============================================================================
-- optimization_jobs
-- =============================================================================
CREATE TABLE public.optimization_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
    job_description_id UUID NOT NULL REFERENCES public.job_descriptions(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'extracting', 'analyzing_jd', 'optimizing',
        'scoring', 'rendering_pdf', 'completed', 'failed', 'cancelled'
    )),
    progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    current_step TEXT,
    error_code TEXT,
    error_message TEXT,
    idempotency_key TEXT UNIQUE,
    template_id TEXT NOT NULL DEFAULT 'ats_modern',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_optimization_jobs_user_created ON public.optimization_jobs (user_id, created_at DESC);
CREATE INDEX idx_optimization_jobs_active_status ON public.optimization_jobs (status)
    WHERE status NOT IN ('completed', 'failed', 'cancelled');

-- FK from resume_versions to optimization_jobs (added after table exists)
ALTER TABLE public.resume_versions
    ADD CONSTRAINT fk_resume_versions_optimization_job
    FOREIGN KEY (optimization_job_id) REFERENCES public.optimization_jobs(id) ON DELETE SET NULL;

-- =============================================================================
-- ats_scores
-- =============================================================================
CREATE TABLE public.ats_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    optimization_job_id UUID NOT NULL UNIQUE REFERENCES public.optimization_jobs(id) ON DELETE CASCADE,
    overall_score NUMERIC(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    keyword_score NUMERIC(5,2),
    formatting_score NUMERIC(5,2),
    structure_score NUMERIC(5,2),
    breakdown JSONB,
    matched_keywords TEXT[],
    missing_keywords TEXT[],
    suggestions JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- generated_exports
-- =============================================================================
CREATE TABLE public.generated_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    optimization_job_id UUID NOT NULL UNIQUE REFERENCES public.optimization_jobs(id) ON DELETE CASCADE,
    pdf_storage_path TEXT NOT NULL,
    tex_storage_path TEXT,
    file_size_bytes BIGINT,
    page_count INT,
    compile_log TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- usage_logs
-- =============================================================================
CREATE TABLE public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    optimization_job_id UUID REFERENCES public.optimization_jobs(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_logs_user_created ON public.usage_logs (user_id, created_at DESC);

-- =============================================================================
-- ai_usage_logs (service role only)
-- =============================================================================
CREATE TABLE public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    optimization_job_id UUID REFERENCES public.optimization_jobs(id) ON DELETE SET NULL,
    operation TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INT,
    output_tokens INT,
    latency_ms INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- updated_at trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER resumes_updated_at
    BEFORE UPDATE ON public.resumes
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- new user → profile
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- increment usage on job complete
-- =============================================================================
CREATE OR REPLACE FUNCTION public.increment_optimizations_on_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
        UPDATE public.profiles
        SET optimizations_used = optimizations_used + 1
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER optimization_job_completed
    AFTER UPDATE ON public.optimization_jobs
    FOR EACH ROW EXECUTE FUNCTION public.increment_optimizations_on_complete();

-- =============================================================================
-- Row Level Security
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ats_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- resumes
CREATE POLICY "Users can CRUD own resumes"
    ON public.resumes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- resume_versions (via resume ownership)
CREATE POLICY "Users can view own resume versions"
    ON public.resume_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.resumes r
            WHERE r.id = resume_versions.resume_id AND r.user_id = auth.uid()
        )
    );

-- job_descriptions
CREATE POLICY "Users can CRUD own job descriptions"
    ON public.job_descriptions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- optimization_jobs
CREATE POLICY "Users can CRUD own optimization jobs"
    ON public.optimization_jobs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ats_scores
CREATE POLICY "Users can view own ats scores"
    ON public.ats_scores FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.optimization_jobs j
            WHERE j.id = ats_scores.optimization_job_id AND j.user_id = auth.uid()
        )
    );

-- generated_exports
CREATE POLICY "Users can view own exports"
    ON public.generated_exports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.optimization_jobs j
            WHERE j.id = generated_exports.optimization_job_id AND j.user_id = auth.uid()
        )
    );

-- usage_logs
CREATE POLICY "Users can view own usage logs"
    ON public.usage_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs"
    ON public.usage_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ai_usage_logs: no client policies (service role only)
