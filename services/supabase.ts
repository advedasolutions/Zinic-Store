import { createClient } from '@supabase/supabase-js';

/**
 * LIVE DATABASE CONNECTION
 * 
 * Connected to Project: urpbwdvkcmytavrloxsn
 */

const supabaseUrl = 'https://urpbwdvkcmytavrloxsn.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVycGJ3ZHZrY215dGF2cmxveHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDcxODgsImV4cCI6MjA4MTgyMzE4OH0.ggUcaut-aoPRs-G9L6ERBJPQl3cw1Oidk-k8UvbiSl0'; 

export const supabase = createClient(supabaseUrl, supabaseKey);