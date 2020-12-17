import React from 'react';
import styled from 'styled-components';

import { observer } from 'mobx-react';

import NotificationsPopover from 'modules/Notifications/NotificationsPopover';
import { translation } from 'services/translation';

import RealtimeStore from 'modules/RealtimeTyping/store';
import widgetStore from 'stores/widgetStore';
import userStore from 'stores/userStore';

const Wrapper = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 5px;
  margin-bottom: 15px;
  margin-top: 5px;
  border-bottom: 1px solid rgba(150, 150, 150, 0.2);
  > div:first-child {
    font-weight: 600;
  }

  sup {
    top: -23px;
    left: 28px;
    height: 20px;
  }
`;

const PeopleListening = styled.span`
  font-weight: 600;
  vertical-align: middle;
`;

interface IProps {
  totalComments: number;
  className?: string;
}

const Header: React.FC<IProps> = observer(({ totalComments = 0, className }: IProps) => (
  <Wrapper className={className}>
    <div>
      {totalComments === 1 ? translation.commentText.when1 : translation.commentText.whenX} ({totalComments})
    </div>
    <div>
      <PeopleListening>
        {widgetStore.realtime &&
          RealtimeStore.activeCount &&
          `${translation.realtime.listening}: ${RealtimeStore.activeCount}`}
      </PeopleListening>
      {!widgetStore.anonymousCommenting && !userStore.isAnonymous && <NotificationsPopover />}
    </div>
  </Wrapper>
));

export default Header;
