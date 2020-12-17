/**
 * @description Common used types/interfaces for 'User' (profile)
 */

declare namespace Comments {
  interface ServerComment {
    id: number;
    state: number;
    authorType: number;
    parentId: number;
    commentText: string;
    createdTimestamp: number;
    dislikeCount: number;
    toxicity: number;
    spamValue: number;
    reportSpamCount: number;
    likeCount: number;
    replyCount: number;
    cookieId: string;
    userId: string;
    name: string;
    pictureUrl: string;
    userPoints: number | null;
    host: string;
    uri: string;
    title: string;
    articleAvatar: string;
    replies: Comments.ServerComment[];
    edited: boolean;
  }

  interface UserAction {
    commentId: number;
    action: number;
    comment?: {
      id: number;
    };
  }

  interface Comment {
    id: number;
    state: number;
    authorType: number;
    parentId: number;
    commentText: string;
    createdTimestamp: number;
    userId: string;
    name: string;
    userPoints: number | string;
    pictureUrl: string;
    timeago: string;
    edited: boolean;
  }

  type DropdownOption = 'myComments' | 'myProfile' | 'fullProfile';
}
