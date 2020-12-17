import * as React from 'react';
import styled from 'styled-components';

import MarkAsRead from './MarkAsRead';
import Refresh from './Refresh';

import Tooltip from '@vuukle/tooltip';
import { translation } from 'services/translation';

interface IProps {
  notificationCount: number;
  loading: boolean;
  clearAllNotifications: () => void;
  refreshNotifications: () => void;
}

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 8px 5px 8px 8px;
  background: ${(props) => (props.theme.isDark ? '#293742' : '#fff')};

  ${Refresh}, ${MarkAsRead} {
    display: flex;
  }

  .v-notification-list__header {
    display: flex;
    margin: 0 5px 0 0;
    font-size: 1rem;
    font-weight: bold;
  }

  > div:last-child {
    ${Tooltip} {
      display: inline-block;
    }
  }
`;

const NotificationListHeader: React.FC<IProps> = ({
  loading,
  clearAllNotifications,
  notificationCount,
  refreshNotifications,
}) => (
  <Wrapper>
    <div>
      <p className="v-notification-list__header">{translation.notifications.notifications}</p>
    </div>
    {!loading && (
      <div>
        {notificationCount > 0 && (
          <Tooltip content={translation.notifications.markRead} placement="bottom">
            <span>
              <MarkAsRead onClick={() => clearAllNotifications()} />
            </span>
          </Tooltip>
        )}
        <Tooltip content={translation.notifications.refreshNotifications} placement="bottom-left">
          <span>
            <Refresh onClick={() => refreshNotifications()} />
          </span>
        </Tooltip>
      </div>
    )}
  </Wrapper>
);

export default NotificationListHeader;
