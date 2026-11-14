export function cleanEnv(value: string | undefined): string | undefined {
  const cleaned = value?.replace(/['"]+/g, '').trim();
  return cleaned || undefined;
}

export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}
