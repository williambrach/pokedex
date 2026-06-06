// app/page.tsx — authenticated entry point. Middleware already gates the route;
// we read the user here to pass their email to the client app.
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import App from '@/components/App';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <App userEmail={user.email ?? ''} />;
}
