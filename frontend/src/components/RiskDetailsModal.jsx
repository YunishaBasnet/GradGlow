import { ArrowUpRight, X } from "lucide-react";

import RiskInsightsView from "./RiskInsightsView";

export default function RiskDetailsModal({
  open,
  onClose,
  studentId,
  week,
  onOpenInsights,
  onRequestWeekFallback,
}) {
  if (!open) return null;

  return (
    <div className="modalOverlay" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label="Risk insights preview">
      <div className="modalCard riskModalCard" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modalHeader">
          <div className="riskModalTitle">Risk insights</div>
          <div className="riskModalHeaderActions">
            <button type="button" className="riskModalLinkBtn" onClick={onOpenInsights}>
              <span>Full view</span>
              <ArrowUpRight size={16} />
            </button>
            <button type="button" className="iconBtn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modalBody">
          <RiskInsightsView
            variant="compact"
            studentId={studentId}
            week={week}
            onRequestWeekFallback={onRequestWeekFallback}
          />
        </div>
      </div>
    </div>
  );
}

