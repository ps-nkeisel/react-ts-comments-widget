import Badge from '@vuukle/badge';
import { observer } from 'mobx-react';
import React from 'react';

import Popover from 'components/Popover';
import userStore from 'stores/userStore';

import NotificationBell from './components/Bell';
import NotificationList from './components/NotificationList';
import notificationStore from './store';

const NotificationsPopover = observer(() => (
  <Popover
    component={<NotificationList />}
    placement="bottom-left"
    appearOn="nothing"
    showPopover={notificationStore.showPopover}
    onClick={() => {
      const userId = userStore.details && userStore.details.id;
      notificationStore.showPopover = !notificationStore.showPopover;
      if (userId && !notificationStore.loaded) {
        notificationStore.getNotificationCount(userId);
        notificationStore.loadNotifications(userId);
      }
    }}
  >
    {!notificationStore.loadingCount && <Badge count={notificationStore.notificationCount} showZero={false} />}
    <NotificationBell style={{ marginRight: '8px' }} />
  </Popover>
));

export default NotificationsPopover;
