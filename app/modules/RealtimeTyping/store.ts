import { makeDevLog } from '@vuukle/utils';
import { action, decorate, observable } from 'mobx';
import CommentsStore from 'modules/CommentList/store';
import { postRealtimeMessage, RealtimeMessageTypes, windowProxy } from 'services/communication';
import widgetStore from 'stores/widgetStore';

export interface IRealtimeTypingData {
  /**
   * The id of the comment that's being replied to
   * -1 is for comments that are being typed in the main comment input box
   */
  commentId: number;
  /**
   * The number of users typing a reply to the comment
   */
  writingCommentCount: number;
}

export interface IRealtimeCommentReply {
  /** ID of the comment */
  commentId: number;
  /** Number of replies to the comment */
  replyCount: number;
}

export interface IRealtimeNewCommentReply {
  /** 
   * New RT update now gives commentId as key and replyCount as value 
   * TODO: Remove old data structure support (commentId and ReplyCount)
   */
  [key: string]: number;
}

export interface IRealtimeData {
  /** Is the current user typing */
  result: boolean;
  /** Array of key/value pairs of users typing replies to specific comment or typing a new comment */
  writingUsers?: IRealtimeTypingData[];
  /** Number of current posted comments */
  currentCommentCount?: number;
  /** Number of online people on the page (not necessarily typing) */
  activeCount?: number;
  /** IDs of the users that are currently typing in the chat */
  typingUsers?: string[];
  /** Array of objects containing the comment ID and the number of replies to that ID */
  commentReplyCounts?: IRealtimeCommentReply[] | IRealtimeNewCommentReply;
}

class RealtimeStorage {
  /** Current user is writing a comment */
  @observable
  private isUserWriting: boolean;
  /** Number of users that are currently writing a message */
  @observable
  private _writingUsers: number;
  /** Number of the new comments to load */
  @observable
  private _newCommentsCount: number = 0;
  /** Timestamp of the last time the 'load new comments' was clicked */
  @observable
  private _lastCommentTimestamp: number = 0;
  /** The id user is replying to (writing a comment) */
  @observable
  private _replyingToID: number = 0;
  /** Array of key/value pairs with info of users writing replies to comments or writing a new comment */
  @observable
  private _writingUsersArray: IRealtimeTypingData[] = [];
  /** Number of people that are online, but not necessarily typing a new comment or a reply */
  @observable
  private _activeCount: number;
  /** Array of user ids that are typing a comment or a reply */
  @observable
  private _typingUsers: string[] = [];
  /** The number of replies to a comment user replied to */
  @observable
  private _lastCommentReplyCount: number;
  /** Array of objects containing the comment ID and the number of replies to that ID */
  @observable
  private _commentReplyCounts: IRealtimeCommentReply[] | IRealtimeNewCommentReply | undefined = undefined;
  /** Array from writingUsers commentIds (all the ids of the comments that are being replied to) */
  @observable
  public writingUsersCommentIDs: number[];
  /** Loading state of reply button */
  @observable
  public loading: boolean = false;

  constructor() {
    if (!widgetStore.realtime) {
      return;
    }

    this.resetLastCommentTimestamp();

    // Send Message to platform.js to ask websocket is users are writing. We also can receive response from platform with these details
    setInterval(() => postRealtimeMessage({ type: RealtimeMessageTypes.IsWriting }), 5000);

    /** 👂 Listen for realtime responses that platform send to us */
    windowProxy.addEventListener((evt: any) => {
      // ✖ Ignore messages that are not related to realtime response that we want to check here
      if (!evt || typeof evt.data !== 'object' || typeof evt.data.realtimeResponse !== 'object') {
        return;
      }
      // ✔ Now we need to check what response we got and do appropriate changes
      const data: IRealtimeData = evt.data.realtimeResponse;
      try {
        if (data.currentCommentCount) {
          this.newCommentsCount = data.currentCommentCount;
        }
        if (typeof data.writingUsers !== 'undefined' && Array.isArray(data.writingUsers)) {
          this.writingUsers = data.writingUsers;
        }
        if (data.activeCount) {
          this.activeCount = data.activeCount;
        }
        if (data.typingUsers) {
          this.typingUsers = data.typingUsers;
        }
        if (data.commentReplyCounts) {
          this.commentReplyCounts = data.commentReplyCounts;
        }
      } catch (err) {
        makeDevLog('error', `Received Realtime message isn't valid`, err);
      }
    });
  }

  /** Number of users that are writing comments at that moment */
  get currentUserWriting(): boolean {
    return this.isUserWriting;
  }

  /** Set number of currently writing users */
  set currentUserWriting(isWriting: boolean) {
    // Make log to realtime socket about changes
    if (this.isUserWriting !== isWriting) {
      this.userReplyID !== 0
        ? postRealtimeMessage({
            type: isWriting ? RealtimeMessageTypes.StartWriting : RealtimeMessageTypes.StopWriting,
            commentId: this.userReplyID,
          })
        : postRealtimeMessage({
            type: isWriting ? RealtimeMessageTypes.StartWriting : RealtimeMessageTypes.StopWriting,
          });
    }

    this.isUserWriting = isWriting;
  }

  /**
   * Number of total users writing a comment
   */
  get writingUsersNumber(): number {
    return this._writingUsers;
  }

  /**
   * Get number of users that currently writing a comment or replying to a comment in an array
   * @return {IRealtimeTypingData[]} number of users that are writing a comment in an array
   */
  get writingUsers(): IRealtimeTypingData[] {
    return this._writingUsersArray;
  }

  /**
   * Set number of users that currently writing a comment
   * @param {number} usersCount - array of comments that have real-time activity
   */
  set writingUsers(usersCount: IRealtimeTypingData[]) {
    let totalCount: number = 0;
    const commentIds: number[] = [];
    // There can be users replying to many comments at once
    usersCount.forEach((item: IRealtimeTypingData) => {
      totalCount += item.writingCommentCount;
      commentIds.push(item.commentId);
    });

    // Assign all ids to a flat array
    this.writingUsersCommentIDs = commentIds;

    /** When a user types a comment, from their perspective, they shouldn't be counted in their session */
    if (totalCount >= 1 && this.currentUserWriting) {
      totalCount--;
    }

    /** If the user is replying to a comment, subtract 1 from the number of typers */
    if (commentIds.indexOf(this.userReplyID) > -1 && this.currentUserWriting) {
      const reply = usersCount.find((counters) => counters.commentId === this.userReplyID);
      if (reply) {
        reply.writingCommentCount--;
      }
    }

    this._writingUsersArray = usersCount;
    this._writingUsers = totalCount;
  }

  /**
   * Get a number of comments that users recently created but these comments are not in the feed
   * @return {number} number of comment that are not loaded in the feed
   */
  get newCommentsCount(): number {
    return this._newCommentsCount;
  }

  /**
   * Update comments count.
   * Reset relative `currentCommentCount` to actual value.
   * @param {number} updatedCount - `currentCommentCount` received from WS.
   */
  set newCommentsCount(updatedCount: number) {
    const updated = updatedCount - CommentsStore.totalComments;

    updated < 0 ? (this._newCommentsCount = 0) : (this._newCommentsCount = updated);
  }

  /**
   * Get the timestamp of the last update for new comments that users recently viewed
   * @return {number} timestamp for new comment that are loaded in the feed lastly
   */
  get lastCommentTimestamp(): number {
    return this._lastCommentTimestamp;
  }

  /**
   * Update last comment timestamp.
   * @param {number} updatedTimestamp
   */
  set lastCommentTimestamp(updatedTimestamp: number) {
    if (updatedTimestamp > this._lastCommentTimestamp) {
      this._lastCommentTimestamp = updatedTimestamp;
    }
  }

  /** Get the id of the reply user is typing a response to */
  get userReplyID(): number {
    return this._replyingToID;
  }

  set userReplyID(id: number) {
    this._replyingToID = id;
  }

  /** Return the reply count of the last comment user posted */
  get replyCount(): number {
    return this._lastCommentReplyCount;
  }

  set replyCount(replies: number) {
    this._lastCommentReplyCount = replies;
  }

  /** Give the number of users online, but not necessarily typing */
  get activeCount(): number {
    return this._activeCount;
  }

  set activeCount(count: number) {
    this._activeCount = count;
  }

  /** Return an array of user ids that are currently typing */
  get typingUsers(): string[] {
    return this._typingUsers;
  }

  set typingUsers(userIds: string[]) {
    this._typingUsers = userIds;
  }

  /** Get the array of objects containing the comment IDs and the number of replies to that ID */
  get commentReplyCounts(): IRealtimeCommentReply[] | IRealtimeNewCommentReply | undefined {
    return this._commentReplyCounts;
  }

  set commentReplyCounts(replyCounts: IRealtimeCommentReply[] | IRealtimeNewCommentReply | undefined) {
    this._commentReplyCounts = replyCounts;
  }

  /**
   * @description Reset counter when performing full reload.
   */
  @action
  public resetCounter() {
    this.newCommentsCount = 0;
  }

  /** Generate a new timestamp when comments are loaded after 'load new comments' */
  @action
  public resetLastCommentTimestamp() {
    const now = new Date();
    const utc_timestamp = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds()
    );
    this.lastCommentTimestamp = Math.floor(utc_timestamp / 1000);
  }

  /**
   * @param ev - "Load {n} new comments" button event.
   * @param {boolean} sorting - whether call comes from sorting method.
   */
  public updateComments = async () => {
    // Changing the sorting method of comments widget calls this function
    // So we need to make sure there are actual new comments before calling
    // The update comments function from comments store
    if (this.newCommentsCount > 0) {
      try {
        await CommentsStore.updateComments(this.newCommentsCount);
        CommentsStore.totalComments = this.newCommentsCount + CommentsStore.totalComments;
        this.newCommentsCount = 0;
      } catch (err) {
        makeDevLog('error', 'RealtimeStore.updateComments error', err);
      }
    }
  };
}

decorate(RealtimeStorage, {
  updateComments: action,
});

export default new RealtimeStorage();
