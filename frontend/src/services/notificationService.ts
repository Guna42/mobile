import { LocalNotifications } from '@capacitor/local-notifications';
import { emotionAPI, JournalHistoryResponse } from './api';

// Catchy Zomato-style daily inactivity notifications
const DAILY_MESSAGES = [
  {
    title: "Your feelings called... 📞",
    body: "They miss you! Take 1 minute to check-in and log your day."
  },
  {
    title: "Scream in a pillow or dance in the kitchen? 💃",
    body: "How is today going? Open Emolit and let it out!"
  },
  {
    title: "A lot happened today... 🤯",
    body: "The good, the bad, and the 'why did I do that?'. Let's write it down."
  },
  {
    title: "Are you 'fine' or actually 'peaceful'? 🍃",
    body: "Let's expand your emotional vocabulary today."
  },
  {
    title: "We miss you more than you miss your ex. 🥺",
    body: "Come log your feelings, it's safer here!"
  },
  {
    title: "Your emotions are waiting in line... 🚶‍♂️",
    body: "Don't keep them waiting! Tap to log your day."
  },
  {
    title: "Emotional check! 🔍",
    body: "Close your eyes, breathe, and tell us how you're feeling right now."
  },
  {
    title: "A prompt a day keeps the stress away. 🧘‍♂️",
    body: "What's on your mind today? Let's jot it down."
  }
];

// Streak warning notifications
const STREAK_WARNINGS = [
  {
    title: "Quick! Save your streak! 🏃‍♂️",
    body: "Your {streak}d streak is about to go out like a candle. 🕯️ 1 minute is all it takes!"
  },
  {
    title: "Don't let the flame go out! 🔥",
    body: "Your {streak}-day journal streak is crying in the corner. Save it now!"
  },
  {
    title: "A {streak}d streak is a terrible thing to waste! 🥺",
    body: "Take 30 seconds to write a sentence and keep it alive!"
  },
  {
    title: "Your {streak}d streak is about to go poof! 💨",
    body: "Stop scrolling, start writing. Log your mood before midnight!"
  }
];

export const NotificationService = {
  // 1. Request notification permissions
  requestPermission: async (): Promise<boolean> => {
    try {
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display === 'granted') return true;

      const request = await LocalNotifications.requestPermissions();
      return request.display === 'granted';
    } catch (e) {
      console.error('[NotificationService] Permission request failed:', e);
      return false;
    }
  },

  // 2. Schedule both Daily Reminders and Streak warnings automatically by reading history
  scheduleReminders: async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('[NotificationService] User not authenticated. Skipping scheduling.');
        return;
      }

      // Fetch history to calculate streak and hasJournaledToday
      let historyRes;
      try {
        historyRes = await emotionAPI.getJournalHistory();
      } catch (err) {
        console.error('[NotificationService] Failed to fetch journal history:', err);
        return;
      }

      const entries = (historyRes as JournalHistoryResponse | undefined)?.entries ?? [];
      
      // Calculate current streak
      let streak = 0;
      if (entries.length > 0) {
        const today = new Date(); 
        today.setHours(0,0,0,0);
        const days = Array.from(new Set(
          entries.map(e => { 
            const d = new Date(e.data.created_at); 
            d.setHours(0,0,0,0); 
            return d.getTime(); 
          })
        )).sort((a,b) => b - a);

        let chk = today;
        for (const ts of days) {
          const diff = (chk.getTime() - ts) / 86_400_000;
          if (diff <= 1) { 
            streak++; 
            chk = new Date(ts); 
          } else {
            break;
          }
        }
      }

      // Check if logged today
      const todayStr = new Date().toDateString();
      const hasJournaledToday = entries.some(e => new Date(e.data.created_at).toDateString() === todayStr);

      console.log('[NotificationService] Streak calculated:', streak, 'Logged today:', hasJournaledToday);

      // ── A. Clear all old Emolit notifications first ──
      // Use standard IDs to avoid duplicates: 
      // ID 1001: Daily Inactivity Reminder
      // ID 1002: Streak Loss Reminder
      await LocalNotifications.cancel({
        notifications: [{ id: 1001 }, { id: 1002 }]
      });

      const hasPermission = await NotificationService.requestPermission();
      if (!hasPermission) {
        console.log('[NotificationService] No permissions granted.');
        return;
      }

      // ── B. Schedule Daily Inactivity Reminder (Zomato Style) ──
      // This will trigger TOMORROW at 8:00 PM (if they haven't opened the app by then)
      const randomDaily = DAILY_MESSAGES[Math.floor(Math.random() * DAILY_MESSAGES.length)];
      const tomorrow8PM = new Date();
      tomorrow8PM.setDate(tomorrow8PM.getDate() + 1);
      tomorrow8PM.setHours(20, 0, 0, 0); // Tomorrow at 8:00 PM

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1001,
            title: randomDaily.title,
            body: randomDaily.body,
            schedule: { at: tomorrow8PM },
            sound: 'default',
            smallIcon: 'ic_launcher',
            actionTypeId: 'OPEN_APP',
            extra: { type: 'daily_reminder' }
          }
        ]
      });
      console.log('[NotificationService] Scheduled Daily Inactivity Reminder for:', tomorrow8PM);

      // ── C. Schedule Streak Loss Warning ──
      // Only schedule if they have an active streak!
      if (streak > 0) {
        const randomWarning = STREAK_WARNINGS[Math.floor(Math.random() * STREAK_WARNINGS.length)];
        const warningBody = randomWarning.body.replace('{streak}', streak.toString());

        if (!hasJournaledToday) {
          // USER IN DANGER: Schedule for TONIGHT at 9:00 PM
          const tonight9PM = new Date();
          tonight9PM.setHours(21, 0, 0, 0);

          // If tonight 9:00 PM has already passed, schedule for 1 hour later
          if (Date.now() > tonight9PM.getTime()) {
            tonight9PM.setHours(new Date().getHours() + 1);
          }

          await LocalNotifications.schedule({
            notifications: [
              {
                id: 1002,
                title: randomWarning.title,
                body: warningBody,
                schedule: { at: tonight9PM },
                sound: 'default',
                smallIcon: 'ic_launcher',
                extra: { type: 'streak_warning' }
              }
            ]
          });
          console.log('[NotificationService] Scheduled URGENT Streak Loss Warning for tonight:', tonight9PM);
        } else {
          // USER IS SAFE TODAY: Schedule warning for TOMORROW night at 9:00 PM (in case they forget tomorrow)
          const tomorrow9PM = new Date();
          tomorrow9PM.setDate(tomorrow9PM.getDate() + 1);
          tomorrow9PM.setHours(21, 0, 0, 0);

          await LocalNotifications.schedule({
            notifications: [
              {
                id: 1002,
                title: randomWarning.title,
                body: warningBody,
                schedule: { at: tomorrow9PM },
                sound: 'default',
                smallIcon: 'ic_launcher',
                extra: { type: 'streak_warning' }
              }
            ]
          });
          console.log('[NotificationService] User safe today. Scheduled Streak Loss Warning for tomorrow night:', tomorrow9PM);
        }
      }
    } catch (e) {
      console.error('[NotificationService] Error scheduling notifications:', e);
    }
  },

  // 3. Schedule a custom task reminder push notification
  scheduleTaskReminder: async (taskId: string, taskText: string, delaySeconds: number) => {
    try {
      const hasPermission = await NotificationService.requestPermission();
      if (!hasPermission) {
        console.warn('[NotificationService] Task reminder skipped - No permission.');
        return;
      }

      const triggerAt = new Date(Date.now() + delaySeconds * 1000);
      const notificationId = Math.floor(Math.random() * 1000000);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: "Action Item Check-in! 🔔",
            body: `Did you complete: "${taskText}"? Let's check in! 🌟`,
            schedule: { at: triggerAt },
            sound: 'default',
            smallIcon: 'ic_launcher',
            extra: { type: 'task_reminder', taskId, taskText }
          }
        ]
      });
      console.log(`[NotificationService] Task reminder set for "${taskText}" in ${delaySeconds}s (trigger: ${triggerAt})`);
    } catch (e) {
      console.error('[NotificationService] Error scheduling task reminder:', e);
    }
  }
};
