CREATE TABLE IF NOT EXISTS public.relay_dispatches (
    proof text PRIMARY KEY CHECK (proof ~ '^[0-9a-f]{32}$'),
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected', 'unknown')),
    has_location boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Provision relay_sender as a dedicated LOGIN role before granting access.
GRANT CONNECT ON DATABASE apoio TO relay_sender;
GRANT USAGE ON SCHEMA public TO relay_sender;
GRANT SELECT, INSERT (proof), UPDATE (status, has_location)
    ON public.relay_dispatches TO relay_sender;
