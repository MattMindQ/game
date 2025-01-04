// src/network/NotificationService.ts

import { NotificationType } from './types';

export class NotificationService {
    private static createNotification(element: HTMLDivElement): void {
        document.body.appendChild(element);
        setTimeout(() => {
            element.style.opacity = '0';
            setTimeout(() => element.remove(), 500);
        }, 3000);
    }

    public static show(message: string, type: NotificationType): void {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white transition-opacity duration-500
            ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`;
        notification.textContent = message;
        this.createNotification(notification);
    }
}