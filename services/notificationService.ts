


import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Zinic Notification Engine
 * 
 * This service leverages Capacitor Local Notifications to provide 
 * immediate system alerts on Android devices. It is triggered by 
 * Supabase Realtime events to ensure web-to-android synchronization.
 */
export class NotificationService {
  private static instance: NotificationService;

  private constructor() {
    this.init();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async init() {
    if (Capacitor.getPlatform() === 'web') return;

    // Request permissions for native Android notifications
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') {
      console.warn("Notification permissions not granted by user.");
    }
  }

  /**
   * Triggers a native Android notification when a new order is detected via Supabase.
   */
  public async notifyNewOrder(orderId: string, department: string) {
    if (Capacitor.getPlatform() === 'web') {
      console.info(`[Web Notice] New Order: #${orderId.slice(-6)} from ${department}`);
      return;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          title: "New Requisition Received",
          body: `Order #${orderId.slice(-6)} from ${department} is awaiting approval.`,
          id: Math.floor(Math.random() * 10000),
          schedule: { at: new Date(Date.now() + 500) },
          sound: 'beep.wav',
          extra: { orderId },
          actionTypeId: 'OPEN_ORDER',
          channelId: 'zinic_alerts'
          // Fix: Removed 'importance' property which is not supported in LocalNotificationSchema
        }
      ]
    });
  }

  /**
   * Triggers a native Android notification for low stock levels.
   */
  public async notifyLowStock(itemName: string, currentStock: number) {
    if (Capacitor.getPlatform() === 'web') return;

    await LocalNotifications.schedule({
      notifications: [
        {
          title: "Critical Stock Warning",
          body: `${itemName} is low (${currentStock} units remaining). Action required.`,
          id: Math.floor(Math.random() * 10000),
          schedule: { at: new Date(Date.now() + 500) },
          extra: { itemName },
          channelId: 'zinic_alerts'
        }
      ]
    });
  }
}

export const notificationService = NotificationService.getInstance();