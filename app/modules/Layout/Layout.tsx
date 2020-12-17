import { observer } from 'mobx-react';
import React from 'react';

import Button from '@vuukle/button';

import Footer from './components/Footer';
import Header from './components/Header';

import commentListStore from 'modules/CommentList/store';
import WidgetStore from 'stores/widgetStore';

import { translation } from 'services/translation';

interface IProps {
  className?: string;
  /** Content to display between Header and Footer */
  children: any;
}

/** Main Widget Layout */
const Layout: React.FC<IProps> = observer(({ children, className }) => (
  <div className={className}>
    {WidgetStore.widgetHidden ? (
      <Button
        loading={commentListStore.loading}
        onClick={() => (WidgetStore.widgetHidden = false)}
        style={{ width: '100%' }}
      >
        {`
        ${!commentListStore.loading &&
          (commentListStore.totalComments > 0
            ? `${translation.buttons.showComments} (${commentListStore.totalComments})`
            : `${translation.common.writeComment}`)}
      `}
      </Button>
    ) : (
      <>
        {!commentListStore.loading && <Header totalComments={commentListStore.totalComments} />}
        {children}
        <Footer />
      </>
    )}
  </div>
));

export default Layout;
