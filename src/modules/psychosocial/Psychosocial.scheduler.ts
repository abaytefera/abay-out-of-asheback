/**
 * psychosocial.scheduler.ts
 *
 * Runs once per day (e.g. via node-cron) and sends a TODAY_VISIT_ALERT
 * notification to every active PROGRAM_MANAGER and the session's own
 * counselor for any PsychosocialSession whose nextSessionDate falls
 * exactly N days from now (default: 1 day ahead = "tomorrow").
 *
 * Wire this up in your app entry-point:
 *
 *   import { startPsychosocialScheduler } from "./psychosocial.scheduler";
 *   startPsychosocialScheduler();          // starts the cron
 *
 * Or call  sendUpcomingSessionReminders()  directly from a job queue worker.
 */

import cron from "node-cron";
import { NotificationType, NotificationPriority, UserRole } from "@prisma/client";
import prisma from "../../config/prisma";

// ── How many days before the session to fire the reminder ────────────────────
const REMINDER_DAYS_BEFORE = 1;

// =============================================================================
// CORE REMINDER JOB
// =============================================================================

export async function sendUpcomingSessionReminders(): Promise<void> {
  const now = new Date();

  // Build the target date window: midnight → 23:59:59 on the target day
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + REMINDER_DAYS_BEFORE);

  const windowStart = new Date(targetDate);
  windowStart.setHours(0, 0, 0, 0);

  const windowEnd = new Date(targetDate);
  windowEnd.setHours(23, 59, 59, 999);

  // Fetch all sessions with a nextSessionDate in the target window
  const sessions = await prisma.psychosocialSession.findMany({
    where: {
      nextSessionDate: {
        gte: windowStart,
        lte: windowEnd,
      },
    },
    select: {
      id: true,
      childId: true,
      counselorId: true,       // actor / counselor
      nextSessionDate: true,
      sessionType: true,
    },
  });

  if (sessions.length === 0) return;

  // Fetch all active PROGRAM_MANAGERs once (reuse across all sessions)
  const managers = await prisma.user.findMany({
    where: { role: UserRole.PROGRAM_MANAGER, isActive: true },
    select: { id: true },
  });
  const managerIds = managers.map((m) => m.id);

  for (const session of sessions) {
    if (!session.nextSessionDate) continue;

    const formattedDate = session.nextSessionDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Build deduplicated recipient list:
    //   all active PROGRAM_MANAGERs  +  the session's counselor (actor)
    const recipientSet = new Set<string>(managerIds);
    if (session.counselorId) recipientSet.add(session.counselorId);
    const recipientIds = Array.from(recipientSet);

    await prisma.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        type: NotificationType.UPCOMING_REMINDER,
        priority: NotificationPriority.MEDIUM,
        title: "Upcoming Psychosocial Session — Tomorrow",
        message:
          `Reminder: a ${session.sessionType} psychosocial session is scheduled ` +
          `for ${formattedDate}. Please ensure all preparations are in place.`,
        entityType: "PsychosocialSession",
        relatedId: session.id,
      })),
      // Avoid duplicate rows if the job accidentally runs twice in the same window
      skipDuplicates: true,
    });
  }

  console.info(
    `[PsychosocialScheduler] Sent upcoming-session reminders for ${sessions.length} session(s) ` +
    `scheduled on ${windowStart.toDateString()}.`
  );
}

// =============================================================================
// CRON REGISTRATION
// =============================================================================

/**
 * Registers a daily cron that fires at 08:00 server time.
 * Call once at application startup.
 */
export function startPsychosocialScheduler(): void {
  // "0 8 * * *" = every day at 08:00
  cron.schedule("0 8 * * *", async () => {
    console.info("[PsychosocialScheduler] Running daily upcoming-session check…");
    try {
      await sendUpcomingSessionReminders();
    } catch (err) {
      console.error("[PsychosocialScheduler] Error sending reminders:", err);
    }
  });

  console.info("[PsychosocialScheduler] Daily reminder scheduler registered (08:00 daily).");
}