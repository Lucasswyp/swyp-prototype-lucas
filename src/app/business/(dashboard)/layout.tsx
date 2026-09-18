import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/business/Sidebar";
import { MobileTabs } from "@/components/business/MobileTabs";
import { BusinessProvider } from "@/contexts/BusinessContext";
import { DataProvider } from "@/contexts/DataContext";
import { createClient } from "@/lib/supabase/server";

export default async function BusinessDashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/business/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!business) redirect("/business/login");

  const businessValue = {
    businessId: business.id as string,
    email: user.email ?? "",
    business: {
      id: business.id,
      name: business.name,
      logoUrl: business.logo_url,
      bannerUrl: business.banner_url,
      verified: business.verified,
      category: business.category,
      location: business.location,
      website: business.website,
      description: business.description,
      followers: business.followers ?? 0,
    },
  };

  return (
    <DataProvider>
      <BusinessProvider value={businessValue}>
        <div className="flex min-h-screen w-full bg-indigo">
          <Sidebar />
          <div className="flex-1 min-w-0">
            <MobileTabs />
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">{children}</main>
          </div>
        </div>
      </BusinessProvider>
    </DataProvider>
  );
}
