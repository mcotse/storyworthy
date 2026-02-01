import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { logger } from './logger';

const log = logger.child({ service: 'auth' });

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured()) {
    log.warn('auth_signin_skipped', { reason: 'supabase_not_configured' });
    return { error: new Error('Supabase not configured') };
  }

  log.info('auth_signin_started', { provider: 'google' });

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/storyworthy/',
    },
  });

  if (error) {
    log.error('auth_signin_failed', error, { provider: 'google' });
  }

  return { error: error ? new Error(error.message) : null };
}

export async function signOut(): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { error: new Error('Supabase not configured') };
  }

  log.info('auth_signout_started');

  const { error } = await supabase.auth.signOut();

  if (error) {
    log.error('auth_signout_failed', error);
  } else {
    log.info('auth_signout_completed');
  }

  return { error: error ? new Error(error.message) : null };
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export function onAuthStateChange(
  callback: (user: User | null, session: Session | null) => void
): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      log.info('auth_state_changed', {
        event,
        user_id: session?.user?.id,
        has_session: Boolean(session),
      });
      callback(session?.user ?? null, session);
    }
  );

  return () => subscription.unsubscribe();
}
