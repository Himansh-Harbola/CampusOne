import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// temporary test
supabase.from('profiles').select('count').then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection failed:', error.message)
  } else {
    console.log('✅ Supabase connected successfully!')
  }
})