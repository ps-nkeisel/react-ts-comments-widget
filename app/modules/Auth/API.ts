import axios from 'axios';
const CancelToken = axios.CancelToken;

const instance = axios.create({
  baseURL: process.env.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export enum CancellationReasons {
  LOGOUT = '@authAPI/logout',
}

export const authAPIs = {
  /** Get user details by token */
  me: {
    cancel: (cancellationReason: CancellationReasons): void => undefined,
    send(authToken: string | null) {
      return instance.post(
        '/api/v1/Auth/me',
        {},
        {
          cancelToken: new CancelToken((c) => (this.cancel = c)),
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
    },
  },
  /** Create new user */
  register: {
    send(name: string, email: string, password: string, ageRange: number = 0) {
      return instance.post('/api/v1/Auth/signupUser', { ageRange, email, name, password, pictureUrl: null });
    },
  },
  withPassword: {
    send: (email: string, password: string) => instance.post('/api/v1/Auth', { email, password }),
  },
  withoutPassword: {
    send: (name: string, email: string, avatar: string = '') =>
      instance.post('/api/v1/Auth/sso', { email, name, avatar }),
  },
};

export default authAPIs;
