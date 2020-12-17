import React from 'react';

import { inject, observer } from 'mobx-react';
import darken from 'polished/lib/color/darken';
import lighten from 'polished/lib/color/lighten';
import styled from 'styled-components';
import { INotification, NotificationStore } from '../store';
import Notification from './Notification';
import NotificationListHeader from './NotificationListHeader';

import Loader from '@vuukle/loader';
import { reportEvent } from 'services/communication';
import { translation } from 'services/translation';

import userStore from 'stores/userStore';

interface IProps {
  className?: string;
}

interface IInjectedProps extends IProps {
  notificationStore: NotificationStore;
}

const NotificationList: React.FC<IProps> = observer((props) => {
  const injectedProps = props as IInjectedProps;

  const listRef: React.RefObject<any> = React.useRef();

  /** Outside click listener for hiding popover on outside click */
  React.useEffect(() => {
    document.addEventListener('click', hideIfOutside, true);

    return () => {
      document.removeEventListener('click', hideIfOutside, true);
    };
  }, []);

  /**
   * If the clicked element is not the notification list(or inside), hide the popover
   */
  const hideIfOutside = (e: MouseEvent) => {
    if (listRef && listRef.current && !listRef.current.contains(e.target as Node)) {
      // Keep a variable to check if the notification bell is clicked
      // If it is clicked, we will not set the showPopover value to false and let a higher level click event handler do it
      let bellWasClicked: boolean = false;

      // Take our event target as an Element
      const targetElement = e.target && (e.target as Element);
      // Check if the target is a part of the Bell svg or the svg itself
      const isTheIconClicked = targetElement && ['path', 'svg', 'g'].indexOf(targetElement.tagName) > -1;
      // Check if the target is the button wrapper of the Bell itself
      const isTheButtonClicked =
        targetElement && targetElement.tagName === 'button' && targetElement.className.indexOf('Bell') > -1;

      // When event target is the icon or the button - it's the Bell that was clicked
      bellWasClicked = Boolean(isTheIconClicked || isTheButtonClicked);

      if (!bellWasClicked) {
        injectedProps.notificationStore.showPopover = false;
      }
    }
  };

  /**
   * Mark all notifications as read and report it to platform
   */
  const clearAllNotifications = () => {
    injectedProps.notificationStore.markAllNotificationsAsRead();
    reportEvent('notifications_readall');
  };

  /**
   * Refresh notifications and report it to platform
   */
  // tslint:disable-next-line: no-shadowed-variable
  const refreshNotifications = (userId: string) => {
    injectedProps.notificationStore.refreshNotifications(userId);
    reportEvent('notifications_refresh');
  };

  const { loading, notifications } = injectedProps.notificationStore;
  const userId = userStore.details && userStore.details.id;

  return (
    <div className={injectedProps.className} onClick={(e) => e.stopPropagation()} ref={listRef}>
      {/** Inline onClick event is for preventing the higher up onClick from Header.tsx from closing the popover */}
      {userId && (
        <NotificationListHeader
          notificationCount={injectedProps.notificationStore.notificationCount}
          loading={loading}
          clearAllNotifications={() => clearAllNotifications()}
          refreshNotifications={() => refreshNotifications(userId)}
        />
      )}
      {loading && (
        <div style={{ padding: '20px 0' }}>
          <Loader size="20px" style={{ margin: '0 auto' }} />
        </div>
      )}
      <div className="v-notification-list">
        {notifications.length === 0 && !loading && (
          <p className="v-notification-list__noitems">{translation.notifications.noNotifications}</p>
        )}
        {notifications.length > 0 &&
          notifications.map((item: INotification) => (
            <Notification
              key={item.notification.id}
              data={item}
              viewed={item.notification.isViewed}
              onMouseDown={() => injectedProps.notificationStore.markNotificationAsRead(item.notification.id)}
            />
          ))}
      </div>
      {userId && !loading && (
        <div className="v-notifications-list__footer">
          <a
            href={
              process.env.NODE_ENV === 'development'
                ? 'https://news1.vuukle.com/notifications'
                : 'https://news.vuukle.com/notifications'
            }
            target="_blank"
            rel="noopener nofollower"
            onClick={() => reportEvent('notifications_seeall')}
          >
            {translation.notifications.seeAll}
          </a>
        </div>
      )}
    </div>
  );
});

const StyledNotificationList = styled(NotificationList)`
  user-select: none;
  background: ${(props) => (props.theme.isDark ? lighten(0.05, '#293742') : '#fbfbfb')};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 3px;

  div:first-of-type {
    display: flex;
    justify-content: space-between;
  }

  .v-notification-list {
    overflow-y: auto;
    max-height: 300px;
    max-width: 308px;
    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: ${(props) =>
        props.theme.isDark ? darken(0.33, props.theme.mutedColor) : lighten(0.33, props.theme.mutedColor)};
      border-radius: 2px;
    }

    &::-webkit-scrollbar-thumb {
      background: #767676;
      border-radius: 2px;
    }
  }

  .v-notification-list__noitems {
    color: ${(props) => props.theme.mutedColor};
    margin: 0;
    font-weight: normal;
    padding: 15px 0;
    text-align: center;
    width: 100%;
  }

  .v-notifications-list__footer {
    background: ${(props) => (props.theme.isDark ? '#293742' : '#fff')};
    text-align: center;
    padding: 8px;
    outline: none;
    a {
      color: #3690d4;
      &:focus {
        box-shadow: none;
      }
    }
  }
`;

export default inject('notificationStore')(StyledNotificationList);
