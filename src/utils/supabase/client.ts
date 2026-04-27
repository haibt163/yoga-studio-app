import { createBrowserClient } from "@supabase/ssr";

// This helper function strips any hidden quotes or spaces
const clean = (val: string | undefined) => val?.replace(/['"]+/g, '').trim();

export const createClient = () =>
  createBrowserClient(
    clean(process.env.NEXT_PUBLIC_SUPABASE_URL)!,
    clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
  );