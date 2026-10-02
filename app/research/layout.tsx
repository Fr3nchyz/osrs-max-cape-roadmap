import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research · fr3nchy",
  description: "Audited OSRS money-making and strategy claims, checked against fr3nchy's account.",
};

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
