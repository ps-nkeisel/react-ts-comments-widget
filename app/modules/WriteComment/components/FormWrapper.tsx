import { observer } from 'mobx-react';
import * as React from 'react';

import Alert from '@vuukle/alert';
import Button from '@vuukle/button';

import { translation } from 'services/translation';

import ProfileRow from 'components/ProfileRow';
import Auth from 'modules/Auth';
import { openModalWidgetProfile, verifyEmail } from 'services/communication';

/** MobX Stores */
import authStore from 'stores/authStore';
import userStore from 'stores/userStore';
import widgetStore from 'stores/widgetStore';

import { areCookiesSupported } from 'utils';

import device from 'services/deviceInfo';
import PrivacyCheckbox from 'modules/Auth/components/PrivacyCheckbox';

import { verificationAPIs } from 'services/apis/index';

export interface IProps {
  /** Function which will be called on form submit */
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  /** Comment box id */
  id: string;
  /** Form/Comment submit is in progress */
  inProgress: boolean;
  /** Alert object to show message */
  alert: { type: 'success' | 'warning' | 'error'; message: string } | null;
  /** Function to close alert. So we allow users to close alert earlier */
  closeAlert: () => void;
  /** If collapsed then only button 'Write Comment' shown first which expands box on click */
  isCollapsed: boolean;
  /** Expand function for isCollapsed: true */
  expand: () => void;
  /** if block is main or opened inside reply. Needed for some logic things. */
  isReply?: boolean;
  /** Commenting Disabled */
  isDisabled: boolean;
  /** Textarea was clicked (User wants to write comment) and we can show additional UI items */
  isClicked: boolean;
}

const FormWrapper: React.FC<IProps> = observer((props) => {
  /**
   * Sends message to the platform to show comments widget with needed params
   * @return {void}
   */
  const openProfileModal = (): void => {
    if (userStore.details) {
      openModalWidgetProfile({
        avatar: userStore.details.avatar,
        id: userStore.details.id,
        name: userStore.details.name,
        points: userStore.details.points,
        hideFullProfile: widgetStore.disabledOptions.includes('fullProfile'),
      });
    }
  };

  const sendVerificationRequest = () => {
    verificationAPIs.sendVerificationEmail();
    verifyEmail();
  };

  // Pass actual data per props change.
  // const userEmail = userStore.details && userStore.details.email;
  const emailVerified = userStore.details && userStore.details.emailVerified;
  const isSSO = authStore.withSSO;
  const cookiesEnabled = areCookiesSupported();
  const isCustomCheckboxProvided = widgetStore.privacy.checkboxText && widgetStore.privacy.privacyPolicyLink;
  const anonGuestCommenting = widgetStore.anonymousCommenting && authStore.withVuukle && !authStore.withPassword;
  const isGuestOrAnon = userStore.isAnonymous || userStore.isGuest;

  /** Commenting has been disabled by publisher */
  if (props.isDisabled) {
    return <Alert>{translation.messages.commentsClosed /* Comments are now closed. */}</Alert>;
  }

  /** Check if we need to collapse main comment box on widget load. */
  if (props.isCollapsed && !props.isReply) {
    return (
      <Button onClick={props.expand} style={{ width: '100%', display: 'block' }}>
        {translation.buttons.addComment /* Add Comment */}
      </Button>
    );
  }
  const style = props.isReply ? { marginLeft: '40px' } : {};
  return (
    <div style={style}>
      <form onSubmit={props.handleSubmit}>
        {userStore.details && (
          <ProfileRow
            hideSettings={isGuestOrAnon}
            hideProfile={widgetStore.disabledOptions.includes('myProfile') || isGuestOrAnon}
            hideShowComments={widgetStore.disabledOptions.includes('myComments') || isGuestOrAnon}
            profile={userStore.details}
            showComments={openProfileModal}
            signOut={authStore.withSSO ? undefined : authStore.signOut}
          />
        )}
        {props.children}
        <div style={{ marginTop: '10px' }}>
          {props.alert && (
            <Alert type={props.alert.type} onClose={props.closeAlert}>
              <span dangerouslySetInnerHTML={{ __html: props.alert.message }} />
            </Alert>
          )}
          {/** For authorized users that are not using SSO authorization or aren't anonymous guests and haven't verified their email, */}
          {/** An alert should be shown that they need to go and verify their e-mail address */}
          {userStore.isAuthorized && !emailVerified && !isSSO && !anonGuestCommenting && (
            <Alert type="warning" style={{ marginTop: '15px' }}>
              {translation.messages.emailNotVerified}{' '}
              <Button
                type="link"
                onClick={sendVerificationRequest}
                style={{ padding: '0', lineHeight: 'inherit', fontSize: 'inherit' }}
              >
                {translation.messages.verifyEmail}
              </Button>
            </Alert>
          )}
          {!cookiesEnabled && !device.isSafari && (
            <Alert type="warning" style={{ marginTop: '15px' }}>
              {translation.messages.enableCookies}
            </Alert>
          )}
          {userStore.isAuthorized && anonGuestCommenting && (
            <div style={isCustomCheckboxProvided ? {} : { marginBottom: '5px' }}>
              <PrivacyCheckbox
                checkboxText={translation.common.agreeWithVuukle}
                checkboxStyles={{ margin: '0 5px', verticalAlign: 'middle' }}
                privacyPolicyLink="https://docs.vuukle.com/privacy-and-policy/"
                privacyPolicyLinkText={translation.common.privacyPolicy}
              />
            </div>
          )}
          {isCustomCheckboxProvided && userStore.isAuthorized && anonGuestCommenting && (
            <div style={{ marginBottom: '5px' }}>
              <PrivacyCheckbox
                checkboxText={widgetStore.privacy.checkboxText}
                checkboxStyles={{ margin: '0 5px', verticalAlign: 'middle' }}
                privacyPolicyLink={widgetStore.privacy.privacyPolicyLink}
                privacyPolicyLinkText={widgetStore.privacy.privacyPolicyLinkText || translation.common.privacyPolicy}
              />
            </div>
          )}
          {userStore.isAuthorized && (
            <div style={{ textAlign: 'right' }}>
              <Button loading={props.inProgress} htmlType="submit">
                {translation.buttons.post}
              </Button>
            </div>
          )}
        </div>
      </form>
      {props.isClicked && <Auth />}
    </div>
  );
});

export default FormWrapper;
