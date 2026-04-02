import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://dizdhlqcqbyuulwzjwov.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpemRobHFjcWJ5dXVsd3pqd292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjgyMDAsImV4cCI6MjA5MDYwNDIwMH0.e9IrBt21fCXUpdf5vVr_PS939TTycgriR-ZgaLvisUE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
