import type { PortalData } from "@/lib/portal-data";
import type { ActionSpec } from "./ActionDialog";
import TradingView from "./TradingView";
import OperationsView from "./OperationsView";
import TransportView from "./TransportView";
import TransactionsView from "./TransactionsView";
import GeneralView from "./GeneralView";
export default function ModuleView(props: {
  data: PortalData;
  section: string;
  locale: string;
  open: (s: ActionSpec) => void;
  notify: (s: string) => void;
}) {
  const section = props.section;
  if (["lots", "bids", "demand"].includes(section))
    return <TradingView {...props} />;
  if (
    [
      "circles",
      "collection",
      "warehouse",
      "quality",
      "inventory",
      "farmers",
      "users",
    ].includes(section)
  )
    return <OperationsView {...props} />;
  if (["transport", "jobs", "earnings", "vehicles"].includes(section))
    return <TransportView {...props} />;
  if (section === "transactions") return <TransactionsView {...props} />;
  return <GeneralView {...props} />;
}
