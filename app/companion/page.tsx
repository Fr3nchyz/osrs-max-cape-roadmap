"use client";

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { formatAge, formatGp } from "@/lib/format";
import {
  clampPvmShare,
  computeFunding,
  evaluateChecklist,
  fundingStage,
  scenarios,
  weeklyHours,
} from "@/lib/companion/goal";
import { valueBank } from "@/lib/companion/bank";
import { BASELINE_FLETCHING_STOCK, fletchingCoverage, fletchingXp } from "@/lib/companion/fletching";
import { PVM_METHODS, availableMethods } from "@/lib/companion/methods";
import { nextMilestone, xpFromHiscores } from "@/lib/maxOrder";
import { nextAction } from "@/lib/companion/nextAction";
import { activeScenario, methodStats, rankMethods, rollingRate } from "@/lib/companion/sessions";
import type { ChecklistId, LatestPricesResponse, ScenarioId, TbowPriceResponse } from "@/lib/companion/types";
import { useCompanionState } from "./useCompanionState";
import { useJson, useNow } from "./useLive";
import { Notice, minutesSince } from "./ui";
import CompanionHeader from "./CompanionHeader";
import FundingHero, { type BankStatus } from "./FundingHero";
import StageLadder from "./StageLadder";
import Scenarios from "./Scenarios";
import Checklist from "./Checklist";
import Gates from "./Gates";
import CapitalInputs from "./CapitalInputs";
import BankImport from "./BankImport";
import Backup from "./Backup";
import NextBestAction from "./NextBestAction";
import Today from "../today/Today";
import { readRoadmapSelections } from "../today/useWeek";

const USERNAME = "fr3nchy";

export default function CompanionPage() {
  const { state, ready, unsaved, update, replace } = useCompanionState();
  const now = useNow();

  const tbow = useJson<TbowPriceResponse>("/api/prices/tbow");
  const hiscores = useJson<unknown>("/api/hiscores");
  const latest = useJson<LatestPricesResponse>("/api/prices/latest", state.bank !== null);

  // Bank valuation at live prices (only when an import exists and prices loaded).
  const { bank, keepItemIds, slippagePct } = state;
  const prices = latest.data?.prices ?? null;
  const valuation = useMemo(
    () => (bank && prices ? valueBank(bank.items, prices, new Set(keepItemIds), slippagePct) : null),
    [bank, prices, keepItemIds, slippagePct]
  );

  const wantsBank = state.useBankImport && bank !== null;
  const bankStatus: BankStatus = !wantsBank ? "off" : valuation ? "on" : latest.loading ? "valuing" : "unavailable";

  // Target uses the instant-buy side. No price, or a bank import that is wanted
  // but can't be valued -> no funding snapshot at all, rather than a gap built
  // from manual fields the user has stopped maintaining.
  const tbowPrice = tbow.data?.high ?? null;
  const funding =
    ready && tbowPrice !== null && (bankStatus === "off" || bankStatus === "on")
      ? computeFunding(state, tbowPrice, valuation)
      : null;
  const stage = funding
    ? fundingStage(funding.gapGp, state.ownsTbow)
    : ready && state.ownsTbow
      ? fundingStage(0, true)
      : null;

  const priceAgeMinutes = tbow.data && now > 0 ? minutesSince(tbow.data.fetchedAt, now) : null;
  const itemPriceAgeMinutes = latest.data && now > 0 ? minutesSince(latest.data.fetchedAt, now) : null;
  const evaluation = funding
    ? evaluateChecklist(state, funding, priceAgeMinutes, itemPriceAgeMinutes, new Date(now))
    : null;
  // Session log -> realized rates, the active scenario and the method ranking.
  const stats = useMemo(() => methodStats(state.sessions), [state.sessions]);
  const rolling = useMemo(() => rollingRate(state.sessions), [state.sessions]);
  const active = activeScenario(stats, rolling);
  const extraRates: { id: ScenarioId; label: string; gpPerHour: number }[] = [];
  if (rolling !== null) extraRates.push({ id: "logged", label: "Your rate", gpPerHour: rolling });
  if (state.customGpPerHour > 0) extraRates.push({ id: "custom", label: "Custom", gpPerHour: state.customGpPerHour });
  const scenarioResults = funding
    ? scenarios(funding.gapGp, state.weekdayHours, state.weekendHours, { extra: extraRates, pvmShare: state.pvmShare })
    : null;

  const { ranked, unrated } = rankMethods(
    availableMethods({ dt2Complete: state.dt2Complete, noWilderness: state.noWilderness }),
    stats
  );
  const weekendDay = now > 0 && [0, 6].includes(new Date(now).getDay());
  const action = nextAction({
    ownsTbow: state.ownsTbow,
    dt2Complete: state.dt2Complete,
    stats,
    weekend: weekendDay,
    topMethod: ranked[0]?.method.name ?? null,
  });
  const xpBySkill = useMemo(() => xpFromHiscores(hiscores.data), [hiscores.data]);
  const roadmapSelections = useMemo(() => (ready ? readRoadmapSelections() : {}), [ready]);
  const maxingStep = hiscores.data ? nextMilestone(xpBySkill) : null;
  const lowAttention = PVM_METHODS.filter((m) => m.lowAttention && !(state.noWilderness && m.wilderness)).map(
    (method) => ({ method, stats: stats.find((s) => s.methodId === method.id) ?? null })
  );
  const fXp = fletchingXp(hiscores.data);
  const fletching = fXp === null ? null : fletchingCoverage(fXp, bank ? bank.items : BASELINE_FLETCHING_STOCK);

  const checklistDetails: Partial<Record<ChecklistId, string>> = {
    priceFresh:
      priceAgeMinutes === null ? "No price fetched yet" : `Price fetched ${formatAge(priceAgeMinutes)}`,
    reserveCovered: funding ? (funding.gapGp === 0 ? "No gap left" : `Gap ${formatGp(funding.gapGp)}`) : undefined,
    proceedsRecalculated:
      funding?.source === "bank" && bank
        ? `Bank imported ${formatAge(minutesSince(bank.importedAt, now))}` +
          (itemPriceAgeMinutes === null ? "" : ` · item prices fetched ${formatAge(itemPriceAgeMinutes)}`)
        : bank
          ? "Bank import is not being used for capital"
          : "No bank import yet",
  };

  const refresh = () => {
    tbow.reload();
    if (bank) latest.reload();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-4 lg:p-10 font-sans selection:bg-yellow-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <CompanionHeader username={USERNAME} onRefresh={refresh} refreshing={tbow.loading} />

        {unsaved && (
          <Notice tone="error">
            <span className="font-bold">Changes aren&apos;t being saved.</span> This browser is blocking local storage
            (it may be full or in private mode), so everything resets when you close the tab. Export a backup to keep
            your data.
          </Notice>
        )}

        {!ready ? (
          <div className="flex items-center justify-center gap-3 py-24 text-neutral-500" role="status">
            <RefreshCw className="w-5 h-5 animate-spin text-yellow-600" aria-hidden />
            <p className="text-xs font-black uppercase tracking-widest">Loading your plan…</p>
          </div>
        ) : (
          <>
            <Today xpBySkill={hiscores.data ? xpBySkill : null} selections={roadmapSelections} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <FundingHero
                className="lg:col-span-8"
                funding={funding}
                tbow={tbow}
                bankStatus={bankStatus}
                onRetryBank={latest.reload}
                bankRetrying={latest.loading}
                bankImportedAt={bank?.importedAt ?? null}
                slippagePct={state.slippagePct}
                ownsTbow={state.ownsTbow}
                now={now}
              />
              <StageLadder className="lg:col-span-4" stage={stage} />
            </div>

            <NextBestAction
              action={action}
              ranked={ranked}
              unrated={unrated}
              noWilderness={state.noWilderness}
              fletching={fletching}
              maxingStep={maxingStep}
              lowAttention={lowAttention}
              stockFromImport={bank !== null}
              hiscores={hiscores}
            />

            <Scenarios
              results={scenarioResults}
              active={active}
              pvmShare={clampPvmShare(state.pvmShare)}
              weeklyHours={weeklyHours(state.weekdayHours, state.weekendHours)}
              weekdayHours={state.weekdayHours}
              weekendHours={state.weekendHours}
              ownsTbow={state.ownsTbow}
              now={now}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <Checklist
                className="lg:col-span-7"
                evaluation={evaluation}
                stage={stage}
                ownsTbow={state.ownsTbow}
                manual={state.checklist}
                onToggle={(id, next) => update((prev) => ({ ...prev, checklist: { ...prev.checklist, [id]: next } }))}
                details={checklistDetails}
              />
              <Gates
                className="lg:col-span-5"
                dt2Complete={state.dt2Complete}
                onDt2Change={(dt2Complete) => update({ dt2Complete })}
                hiscores={hiscores}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-5 space-y-4 min-w-0">
                <CapitalInputs state={state} update={update} bankActive={bankStatus === "on"} />
                <Backup state={state} replace={replace} />
              </div>
              <BankImport
                className="lg:col-span-7"
                state={state}
                update={update}
                latest={latest}
                valuation={valuation}
                now={now}
              />
            </div>
          </>
        )}

        <footer className="pt-10 pb-6 text-center border-t border-neutral-900">
          <div className="flex justify-center items-center gap-6 opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest">T-bow plan for {USERNAME}</p>
            <div className="w-1 h-1 rounded-full bg-neutral-700" />
            <p className="text-[10px] font-black uppercase tracking-widest">T-bow Companion</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
