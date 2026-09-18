"use client";

import { createContext, useContext } from "react";
import type { Company } from "@/types";

interface BusinessState {
  businessId: string;
  business: Company;
  email: string;
}

const BusinessContext = createContext<BusinessState | null>(null);

export function BusinessProvider({
  value,
  children,
}: {
  value: BusinessState;
  children: React.ReactNode;
}) {
  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within BusinessProvider");
  return ctx;
}
