import { createClient } from 'https://cdn.skypack.dev/pin/@supabase/supabase-js@v2.81.1-9WFD4ARoitBmWAKgCd9B/mode=imports,min/optimized/@supabase/supabase-js.js';
import { groupByDate } from './utils.js';

// no panic! this is a public anon key ...
const SUPABASE_KEY =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MTQxNDM2MCwiZXhwIjo0OTE3MDg3OTYwLCJyb2xlIjoiYW5vbiJ9.TQgk86vspFhjArvT-LU7-Qfqe2rqVTw18mH2VAqkulE';
const SUPABASE_URL = 'https://supabasekong-fwco0gwcckw08o0kocw4ksck.playground.kum.rocks';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const fetchData = async () => {
  const { data, error } = await supabase
    .from('count')
    .select('*', { count: 'exact', head: false })
    .gte('created_at', new Date().toDateString());

  if (error) {
    console.log(error);
  }
  return data;
};

export const fetchAllData = async () => {
  const { data, error } = await supabase
    .from('count')
    .select('created_at, count')
    .gte(
      'created_at',
      new Date(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).toDateString(),
    )
    .order('created_at', { ascending: true });
  if (error) {
    console.log(error);
  }
  return groupByDate(data, 'created_at');
};

export const fetchProfile = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { user } = session;
  const { data: profile, error } = await supabase
    .from('profile')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) {
    console.log(error);
  }
  return profile;
};
