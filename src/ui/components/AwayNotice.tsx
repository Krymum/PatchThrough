import type { OfflineReport } from '../../game/offline';
import { useContent } from '../ContentContext';
import { formatMoney } from '../format';

interface AwayNoticeProps {
  report: OfflineReport;
  onDismiss: () => void;
}

const MS_PER_MINUTE = 60_000;

export function AwayNotice({ report, onDismiss }: AwayNoticeProps) {
  const { ui, locale } = useContent();
  const totalMinutes = Math.round(report.countedMs / MS_PER_MINUTE);
  const duration = ui.duration(Math.floor(totalMinutes / 60), totalMinutes % 60);
  const text =
    report.earnedCents > 0
      ? ui.welcomeBack(duration, formatMoney(report.earnedCents, locale))
      : ui.welcomeBackNothing(duration);

  return (
    <div className="banner banner--away" role="status">
      <p>{text}</p>
      <button type="button" className="button" onClick={onDismiss}>
        {ui.dismiss}
      </button>
    </div>
  );
}
