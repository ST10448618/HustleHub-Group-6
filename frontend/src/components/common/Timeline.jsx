import { Check, X, Circle } from 'lucide-react';
import './Timeline.css';

/**
 * steps: [{ id, label, status }] where status is one of
 * 'done' | 'current' | 'pending' | 'cancelled'.
 *
 * This is deliberately generic - it just draws whatever steps it's
 * given. The actual booking-status-to-steps logic (the exact timeline
 * rules from Screens 09 and 18: combined "Booking Created & Deposit
 * Paid" step, the CANCELLED branch replacing the forward timeline
 * entirely, etc.) belongs in a BookingTimeline component built in a
 * later phase, which will call this one.
 */
function Timeline({ steps }) {
  return (
    <ol className="timeline">
      {steps.map((step) => (
        <li key={step.id} className={`timeline-step timeline-step-${step.status}`}>
          <span className="timeline-marker" aria-hidden="true">
            {step.status === 'done' && <Check size={14} />}
            {step.status === 'cancelled' && <X size={14} />}
            {(step.status === 'current' || step.status === 'pending') && <Circle size={8} />}
          </span>
          <span className="timeline-label">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

export default Timeline;