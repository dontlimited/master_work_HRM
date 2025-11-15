import { logger } from '../utils/logger';

export type NotificationEvent =
  | { type: 'LEAVE_APPROVED'; payload: { leaveId: string } }
  | { type: 'DOCUMENT_UPLOADED'; payload: { documentId: string; filename: string } };

export async function notify(event: NotificationEvent) {
  // For MVP, log to console/logger; could be extended to email
  logger.info(`Notification: ${event.type}`, { payload: event.payload });
}


