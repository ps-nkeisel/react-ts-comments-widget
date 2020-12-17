import { observable } from 'mobx';
import { notificationAPIs } from 'services/apis';

export interface INotification {
  /** The user who caused the notification */
  senderName: string;
  /** The user's profile picture */
  senderPictureUrl: string | null;
  /** Comment's first 50 letters (if notification is a comment notification) */
  commentFirst50: string | '';
  notification: {
    /** The host source of the notification */
    host: string;
    uri: string;
    /**
     * Notification type number indicates what kind of notification it is (1-8)
     * 1 is reply to comment
     * 2 is rejection of comment
     * 3 is approval of comment
     * 4 is like on comment
     * 5 is dislike on comment
     * 6 is user being mentioned in a comment
     * 7 is when user is being followed by someone
     * 8 is when their comment is sent to moderation
     */
    notificationType: number;
    /** The comment ID for which the notification was created */
    commentId: string;
    articleId: string;
    senderId: string;
    receiverId: string;
    /** Is notification read or not */
    isViewed: boolean;
    /** Notification ID */
    id: number;
    /** UNIX timestamp of when notification was created */
    createdTimestamp: number;
  };
}

export class NotificationStore {
  /** Number of notifications */
  @observable
  public notificationCount: number = 0;
  /** Notification data */
  @observable
  public notifications: INotification[] = [];
  /** Notification data API loading state during request */
  @observable
  public loading: boolean = false;
  /** Notification data API loading state after request */
  @observable
  public loaded: boolean = false;
  /** Notification count API loading state during request */
  @observable
  public loadingCount: boolean = false;
  /** Show or hide popover */
  @observable
  public showPopover: boolean = false;

  /**
   * @public
   * @description Get the notification count
   * @param {string} userId User ID to get notifications count for
   */
  public getNotificationCount = async (userId: string) => {
    this.loadingCount = true;
    try {
      const response = await notificationAPIs.getNotificationCount(userId);
      if (response.success) {
        this.notificationCount = response.data;
      }
    } catch (err) {
      this.notificationCount = 0;
      if (process.env.NODE_ENV === 'development') {
        console.error('Notifications API error', err); // tslint:disable-line
      }
    } finally {
      this.loadingCount = false;
    }
  };

  /**
   * @public
   * @description Get the latest notifications
   * @param {string} userId User ID to get the latest notifications for
   * @param {number} limit Number of notifications to get
   */
  public loadNotifications = async (userId: string, limit: number = 20) => {
    this.loading = true;
    try {
      const response = await notificationAPIs.getLatestNotifications(userId, limit);
      if (response.success) {
        this.notifications = response.data;
        this.loaded = true;
      }
    } catch (err) {
      this.notifications = [];
      this.loaded = false;
      if (process.env.NODE_ENV === 'development') {
        console.error('Notifications API error', err); // tslint:disable-line
      }
    } finally {
      this.loading = false;
    }
  };

  /**
   * @public
   * @description Mark a notification or notifications as read
   * @param {number | number[]} notificationId The notification ID(s) to mark as read
   * @param {INotification} noificationItem The actual notification objects
   */
  public markAsRead = async (notificationId: number | number[], notificationItem?: INotification) => {
    try {
      const response = await notificationAPIs.markNotificationsAsRead(notificationId);
      if (response.success) {
        // If we only get 1 notification - clear that one, else we clear all notifications in the array
        if (!Array.isArray(notificationId)) {
          if (notificationItem) {
            notificationItem.notification.isViewed = true;
            this.notificationCount--;
          }
        } else {
          notificationId.forEach((item) => {
            const notification = this.notifications.find((element) => item === element.notification.id);
            if (notification) {
              notification.notification.isViewed = true;
              this.notificationCount--;
            }
          });
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Notifications API error', err); // tslint:disable-line
      }
    }
  };

  /**
   * Reload notifications from API
   * @param {string | null} userId The user to refresh notifications for
   */
  public refreshNotifications(userId: string | null) {
    this.showPopover = true;
    if (userId && !this.loading) {
      this.notifications = [];
      this.getNotificationCount(userId);
      this.loadNotifications(userId);
    }
  }

  /**
   * Get the notification and make sure it's not read before marking it as a read notification
   * @param {number} notificationId The ID of the notification
   */
  public markNotificationAsRead(notificationId: number) {
    const item = this.notifications.find((elem) => elem.notification.id === notificationId);
    if (item && !item.notification.isViewed) {
      this.markAsRead(notificationId, item);
    }
  }

  /**
   * Mark all notifications as read
   */
  public markAllNotificationsAsRead() {
    const notificationIds: number[] = [];
    this.notifications.forEach((item) => notificationIds.push(item.notification.id));
    this.markAsRead(notificationIds);
  }

  /**
   * Clears the store data
   */
  public clearNotifications = () => {
    this.notificationCount = 0;
    this.notifications = [];
    this.loading = false;
    this.loaded = false;
    this.loadingCount = false;
  };
}

export default new NotificationStore();
