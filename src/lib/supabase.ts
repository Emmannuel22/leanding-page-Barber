import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kjmlodfwlcmfmuesjshr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqbWxvZGZ3bGNtZm11ZXNqc2hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMzUxMjIsImV4cCI6MjA5NDgxMTEyMn0.2qRQQDMUEbWOFsGVSNQaDI9fqti4UT-aYLzKynKHMtw';

export const supabase = createClient(supabaseUrl, supabaseKey);