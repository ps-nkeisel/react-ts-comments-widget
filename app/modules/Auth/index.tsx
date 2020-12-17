import { observer } from 'mobx-react';
import * as React from 'react';
import styled from 'styled-components';

import SignInForm from './components/SignInForm';
import SignInAnonForm from './components/SignInAnonForm';
import SignInWithoutPasswordForm from './components/SignInWithoutPasswordForm';
import SignInFormWithGuest from './components/SignInFormWithGuest';
import SignUpForm from './components/SignUpForm';
import SocialAuth from './components/SocialAuth';
import SSO from './components/SSO';

import authStore from 'stores/authStore';
import userStore from 'stores/userStore';
import widgetStore from 'stores/widgetStore';

import { generateRandomEmail, generateRandomName } from 'utils/random';

interface IProps {
  className?: string;
}

interface IState {
  /**
   * Toggle item to know if needed to show sign up or sign in form,
   * as for password auth we have 2 views: sign in and sign up
   */
  showSignUp: boolean;

  name: string;
  email: string;
  password: string;
  generatedName: string;
  generatedEmail: string;
  signInAsGuest: boolean;
}

const Auth: React.FC<IProps> = observer((props) => {
  const [formData, setFormData] = React.useState<IState>({
    showSignUp: false,

    email: '',
    name: '',
    password: '',
    generatedName: generateRandomName(),
    generatedEmail: generateRandomEmail(),

    signInAsGuest: false,
  });

  const handleInputChange = (e: React.FormEvent<HTMLInputElement>) => {
    if (e.currentTarget.name === 'guestSignin') {
      setFormData({
        ...formData,
        signInAsGuest: e.currentTarget.checked,
      });
    } else {
      setFormData({
        ...formData,
        [e.currentTarget.name as 'name']: e.currentTarget.value,
      });
    }
  };

  const handleSignInCombinedForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.signInAsGuest) {
      await authStore.signInWithoutPassword(formData.email, formData.name);
    } else {
      await authStore.signIn(formData.email, formData.password);
    }

    resetForm();
  };

  const handleSignInSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await authStore.signIn(formData.email, formData.password);

    resetForm();
  };

  const handleSignInWithoutPasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await authStore.signInWithoutPassword(formData.email, formData.name);

    resetForm();
  };

  const handleAnonSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await authStore.signInWithoutPassword(formData.generatedEmail, formData.generatedName);

    resetForm();
  };

  const handleSignUpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await authStore.signUp(formData.name, formData.email, formData.password);

    resetForm();
  };

  const resetForm = () => {
    if (!authStore.alert.value) {
      clearInputValues();
      authStore.alert.close();
    }
  };

  /** Clears ALL inputs values state */
  const clearInputValues = () =>
    setFormData({
      ...formData,
      name: '',
      email: '',
      password: '',
      signInAsGuest: false,
    });

  /**
   * @name toggleView
   * @protected
   * @description Toggles view for password auth configuration. So user can sign in or sign up
   * @returns {void}
   */
  const toggleView = (): void => {
    setFormData({
      ...formData,
      showSignUp: !formData.showSignUp,
      email: '',
      password: '',
      name: '',
      generatedEmail: '',
      generatedName: '',
      signInAsGuest: false,
    });
    authStore.alert.close();
  };

  /**
   * @name renderVuukleAuth
   * @description Renders auth or sign up form based on configuration.
   * It can be password/non-password auth or sign up
   * @return {React.ReactElement<any>} SignUp or PasswordAuth, or Passwordless auth based on configuration
   */
  const renderVuukleAuth = (): React.ReactElement<any> | null => {
    const baseProps = {
      onInputChange: handleInputChange,
      loading: authStore.inProgress,
      errorMessage: authStore.alert.value && authStore.alert.value.message,
      onAlertClose: authStore.alert.close,
    };

    if (formData.showSignUp && (authStore.withVuukle || authStore.withPassword)) {
      return (
        <SignUpForm
          {...baseProps}
          name={formData.name}
          email={formData.email}
          password={formData.password}
          onSubmit={handleSignUpSubmit}
          onFormToggleClick={toggleView}
        />
      );
    } else if (authStore.withVuukle && authStore.withPassword) {
      return (
        <SignInFormWithGuest
          {...baseProps}
          email={formData.email}
          name={formData.name}
          password={formData.password}
          signInAsGuest={formData.signInAsGuest}
          onFormToggleClick={toggleView}
          onSubmit={handleSignInCombinedForm}
        />
      );
    } else if (!authStore.withVuukle && authStore.withPassword) {
      return (
        <SignInForm
          {...baseProps}
          email={formData.email}
          password={formData.password}
          onFormToggleClick={toggleView}
          onSubmit={handleSignInSubmit}
        />
      );
    } else if (authStore.withVuukle && !authStore.withPassword) {
      return (
        /** Render auth without password if type of this auth is disabled */
        <SignInWithoutPasswordForm
          {...baseProps}
          name={formData.name}
          email={formData.email}
          onSubmit={handleSignInWithoutPasswordSubmit}
        />
      );
    }
    return null;
  };

  /** If user is authorized we don't need to show auth */
  if (userStore.isAuthorized) {
    return null;
  }

  const { signInWithSocial, withSSO, openSSO } = authStore;

  return (
    <section className={props.className}>
      {/** Render social auth if configured */}
      {!widgetStore.anonymousCommenting && (
        <>
          <SocialAuth
            facebook={authStore.facebookEnabled}
            google={authStore.googleEnabled}
            twitter={authStore.twitterEnabled}
            disqus={authStore.disqusEnabled}
            onClick={signInWithSocial}
          />
          {/** Render Vuukle Auth if configured */}
          <div>{!withSSO && renderVuukleAuth()}</div>
        </>
      )}
      {/** Render SSO only button if everything else is disabled */}
      {withSSO && <SSO onClick={openSSO} />}
      {widgetStore.anonymousCommenting && (
        <SignInAnonForm
          loading={authStore.inProgress}
          name={formData.generatedName}
          email={formData.generatedEmail}
          onSubmit={handleAnonSignIn}
        />
      )}
    </section>
  );
});

const AuthStyled = styled(Auth)`
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  > div {
    &:first-child {
      min-width: 170px;
      max-width: 100%;
      flex-grow: 1;
    }
    &:last-child {
      flex-grow: 3;
      width: 100%;
      max-width: 65%;
    }
  }

  @media (max-width: 470px) {
    flex-direction: column;
    > div:last-child {
      margin-top: 10px;
      max-width: 100%;
    }
  }
`;

export default AuthStyled;
