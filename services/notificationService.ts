
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

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

    // Request permissions for local notifications
    await LocalNotifications.requestPermissions();

    // Setup Push Notifications
    await PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        PushNotifications.register();
      }
    });

    PushNotifications.addListener('registration', token => {
      console.log('Push registration success, token: ' + token.value);
    });

    PushNotifications.addListener('pushNotificationReceived', notification => {
      console.log('Push received: ' + JSON.stringify(notification));
    });
  }

  public async notifyNewOrder(orderId: string, department: string) {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "New Order Received",
          body: `Order #${orderId.slice(-6)} from ${department} is awaiting approval.`,
          id: Math.floor(Math.random() * 10000),
          schedule: { at: new Date(Date.now() + 1000) },
          sound: 'beep.wav',
          extra: { orderId },
          actionTypeId: 'OPEN_ORDER'
        }
      ]
    });
  }

  public async notifyLowStock(itemName: string, currentStock: number) {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "Critical Stock Warning",
          body: `${itemName} is low (${currentStock} units remaining). Order replenishment soon.`,
          id: Math.floor(Math.random() * 10000),
          schedule: { at: new Date(Date.now() + 1000) },
          extra: { itemName }
        }
      ]
    });
  }
}

export const notificationService = NotificationService.getInstance();
