/**
 * @description Common used types/interfaces for 'User' (profile)
 */
declare interface User {
  name: string;
  id: string;
  email: string;
  emailVerified: boolean;
  points: number;
  avatar: string | null;
  isModerator: boolean;
  isPasswordEntered: boolean;
}
