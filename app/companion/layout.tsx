import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "T-bow Companion — fr3nchy",
  description:
    "Funding plan for a Twisted bow: live GE price, funding gap net of tax and slippage, stage, time-to-goal scenarios, pre-purchase checklist and RuneLite bank import.",
};

export default function CompanionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
