import Header from "@/components/marketing/Header";
import Footer from "@/components/marketing/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <div className="bloom" aria-hidden="true" />
      <Header isAuthenticated={!!user} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
