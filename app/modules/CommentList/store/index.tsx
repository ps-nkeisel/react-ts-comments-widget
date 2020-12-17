import { makeDevLog } from '@vuukle/utils';
import { action, decorate, observable } from 'mobx';
import { commentsApis } from 'services/apis';
import {
  reportEvent,
  addCommentsToPowerbarCounters,
  notifyPlatformOfLoadMore,
  communicateNewReplyCount,
} from 'services/communication';
import urlSearchParams from 'services/urlSearchParams';

import Comment from './CommentItem';

import RealtimeStore from 'modules/RealtimeTyping/store';
import widgetStore from 'stores/widgetStore';
import userStore from 'stores/userStore';

export enum SortingType {
  get_latest = 'get_latest',
  get_most_up_votes = 'get_most_up_votes',
  get_reverse_chrono = 'get_reverse_chrono',
  get_most_replied = 'get_most_replied',
  Latest = 'get_latest',
  MostUpVotes = 'get_most_up_votes',
  ReverseChrono = 'get_reverse_chrono',
  MostReplied = 'get_most_replied',
}

/** MobX Comments Store */
export class CommentsStore {
  /** Total Comments for article widget has been loaded */
  public totalComments: number = 0;
  /** Main comments array. Replies created inside each comment: Comment[] > Comment[] */
  public comments: Comment[] = [];
  /** Comment object of the hyperlinked ID of comment */
  public selectedComment: Comment | undefined;
  /** Comments are in loading state */
  public loading: boolean = true;
  /** If more comments available. Used to know if it's needed to show 'Load More' button */
  public moreAvailable: boolean = true;
  /**
   * ===========================================================================================
   * Configurable from outside
   * @description these params can be configured by article owner using query string inside url
   * ===========================================================================================
   */
  /** Default sorting to load comments */
  public _sortBy: SortingType = SortingType.Latest;
  /** Comments adding are in sync with WordPress. Used to sync comments with WP dashboard */
  public syncWithWP: boolean;
  /** How many comments to load */
  public toLoad: number;
  /** Indicates if first loadVuukle request is done */
  public initialLoadingComplete: boolean = false;
  /** First run of change sorting */
  public firstChangeSort: boolean = true;

  constructor() {
    /** Get configuration from query string */
    this.syncWithWP = urlSearchParams.get('wpSync') === 'true';
    this.toLoad = parseInt(urlSearchParams.get('commentsToLoad') || '5', 10);
  }

  public get sortBy() {
    return this._sortBy;
  }

  public set sortBy(sortBy: SortingType) {
    this._sortBy = sortBy;
    // Remove selected comment as user not interested anymore
    if (this.selectedComment instanceof Comment && !this.firstChangeSort) {
      this.selectedComment = undefined;
    }

    if (this.initialLoadingComplete) {
      this.loadComments(0);
    }
  }

  /**
   * @public
   * @description Remove comment from this.comments
   * @param {Comment} commentInstance - Comment class instance to remove from array
   * @returns {void}
   */
  public removeComment = (commentInstance: Comment): void => {
    this.comments = this.comments.filter((comment) => comment !== commentInstance);
  };

  /**
   * @public
   * @param  {string} ID - comment ID to get details for
   * @return {Promise<void>}
   */
  public async getCommentDetailsByID(ID: string | number): Promise<void> {
    const convertedID = Number(ID);

    if (!convertedID) {
      return;
    }

    try {
      const response = await commentsApis.getByID(convertedID);
      if (response.success && response.data) {
        this.selectedComment = CommentsStore.createCommentsWithRecursion(
          [response.data],
          () => (this.selectedComment = undefined),
          null,
          convertedID
        )[0];
      }
    } catch (err) {
      makeDevLog('error', 'getCommentDetailsByID err', err);
    }
  }

  /**
   * @name changeSorting
   * @description On comments sorting change
   * @public
   * @param {'get_latest'|'get_top_comment'|'get_most_replied'|'get_most_up_votes'|'get_reverse_chrono'} sortBy - sorting order
   * @param {boolean} preferServerSort Decide if the sorting method should be persisted to localStorage or not
   * @returns {void}
   */
  public changeSorting = async (sortBy: SortingType, preferServerSort: boolean = false): Promise<void> => {
    if (widgetStore.realtime && this.initialLoadingComplete) {
      RealtimeStore.updateComments();
    }

    if (navigator.cookieEnabled && !preferServerSort) {
      localStorage.setItem('commentsStore', JSON.stringify({ _sortBy: sortBy }));
    }

    this.sortBy = sortBy;

    if (this.firstChangeSort) {
      this.firstChangeSort = false;
    }
  };

  /**
   * @name loadMoreComments
   * @description Load more comments and report it to platform
   * @public
   */
  public loadMoreComments = async (): Promise<void> => {
    this.loadComments(this.comments.length);
    reportEvent('comments_loadmore');
  };

  /**
   * @name loadNewComments
   * @description Replace visible comments when WS tells there are new available.
   * @public
   */
  public loadNewComments = async (newCommentsCount: number): Promise<void> => {
    this.loading = true;
    try {
      this.totalComments += newCommentsCount;
      const response: any = await commentsApis.loadVuukle(5);
      const { comments } = response.data;

      if (widgetStore.realtime) {
        RealtimeStore.resetCounter();
      }

      this.comments = [
        ...CommentsStore.createCommentsWithRecursion(
          comments.items as Comments.ServerComment[],
          this.removeComment,
          null,
          undefined,
          true
        ),
      ];
      RealtimeStore.resetLastCommentTimestamp();
      // sync comments with powerbar
      addCommentsToPowerbarCounters(newCommentsCount);
      // notify platform so that blue bar can update accordingly
      notifyPlatformOfLoadMore();
      // Make sure old comments can still be loaded
      this.moreAvailable = this.totalComments > this.comments.length;
    } catch (err) {
      makeDevLog('error', 'Comments update API response:', err.message);
    } finally {
      this.loading = false;
    }
  };

  /**
   * @name loadNewReplies
   * @description Replace visible replies of a given comment when WS tells there are new available.
   * @public
   */
  public loadNewReplies = async (newCommentsCount: number, comment: Comment): Promise<void> => {
    this.loading = true;
    RealtimeStore.loading = true;
    try {
      this.totalComments += newCommentsCount;
      const response: any = await commentsApis.loadReplies(comment.data.id);
      const replies = response.data;
      // Subtract the loaded reply count from the total count
      RealtimeStore.newCommentsCount -= newCommentsCount;

      // The order of replies should stay consistent, so they are reversed
      comment.replies = [
        ...CommentsStore.createCommentsWithRecursion(
          replies as Comments.ServerComment[],
          this.removeComment,
          null,
          undefined,
          true
        ).reverse(),
      ];
      // sync comments with powerbar
      addCommentsToPowerbarCounters(newCommentsCount);
      // notify platform so that blue bar can update accordingly
      communicateNewReplyCount(newCommentsCount);
      // Make sure old comments can still be loaded
      this.moreAvailable = this.totalComments > this.comments.length;
    } catch (err) {
      makeDevLog('error', 'Comments full replies API response:', err.message);
    } finally {
      this.loading = false;
      RealtimeStore.loading = false;
    }
  };

  /**
   * @name addComment
   * @description add comment to feed if sorting is latest and if user successfully posted comment
   * @param {Object} comment - comment from server response to add
   * @returns {void}
   */
  public addComment = (comment: Comments.ServerComment): void => {
    // We just add main comment to feed in case it's latest sorting
    if (this.sortBy === SortingType.Latest) {
      this.comments.unshift(new Comment(comment, this.removeComment));
    }
  };

  /**
   * @name initialLoadSuccess
   * @description First of all we have initial load API request which returns many details.
   * This method is called once we received response from this initial API call request.
   * @param {<Object>[]} comments - server comments array with replies inside
   * @param {number} totalComments - total comments under article from server response
   * @returns {void}
   */
  // TODO: move this to part of `commentsApis.initialLoading().then` and probably make createCommentsWithRecursion static
  public initialLoadSuccess = async (comments: Comments.ServerComment[], totalComments: number): Promise<void> => {
    this.comments = CommentsStore.createCommentsWithRecursion(comments, this.removeComment, null);
    this.moreAvailable = comments.length >= this.toLoad;
    this.totalComments = totalComments;
    this.loading = false;
  };

  /**
   * @public
   * @description Change comments sorting and get sorted comments from the server
   * @param {number} start - from which comment to load
   * @param {'get_latest'|'get_most_replied'|'get_most_up_votes'|'get_reverse_chrono'} sortBy -
   * sorting order
   * @returns {void}
   */
  @action
  public loadComments = async (start: number = 0): Promise<void> => {
    commentsApis.get.cancel();
    if (start === 0) {
      this.comments = [];
      this.moreAvailable = false;
    }

    this.loading = true;

    try {
      const response: any = await commentsApis.get.send({ sortBy: this.sortBy, start });

      const { comments } = response.data;

      this.comments.push(
        ...CommentsStore.createCommentsWithRecursion(
          comments.items as Comments.ServerComment[],
          this.removeComment,
          null
        )
      );
      this.moreAvailable = comments.items.length >= 5;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // tslint:disable-next-line
        console.warn('Comments API sorting error:', error.message);
      }
    } finally {
      this.loading = false;
    }
  };

  /**
   * Update feed with recently newly added comments
   * @param {number} newCommentsCount - newly added comments count to load
   * @return {Promise}
   */
  @action
  public updateComments = async (newCommentsCount: number): Promise<void> => {
    this.loading = true;
    try {
      const response: any = await commentsApis.get.send({ start: 0, pageSize: newCommentsCount });
      const { comments } = response.data;
      this.comments = [
        ...CommentsStore.createCommentsWithRecursion(
          comments.items as Comments.ServerComment[],
          this.removeComment,
          null,
          undefined,
          true
        ),
        ...this.comments,
      ];
      RealtimeStore.resetLastCommentTimestamp();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        // tslint:disable-next-line
        console.warn('Comments update API response:', err.message);
      }
    } finally {
      this.loading = false;
    }
  };

  /**
   * Utils to create comments items using recursion to process replies too
   * @param comments - server comments array
   * @param removeFn - commend remove function
   * @param parentComment - parent comment
   * @param highlightID - ID of the comment to highlight on initial render (used for comment hyperlinking)
   * @return created comments array
   */
  private static createCommentsWithRecursion(
    comments: Comments.ServerComment[],
    removeFn: (comment: Comment) => void,
    parentComment: Comment | null = null,
    highlightID?: number,
    isRealTime?: boolean
  ): Comment[] {
    return comments.map((comment) => {
      const CommentItem = new Comment(comment, removeFn, parentComment, isRealTime);

      if (CommentItem.data.id === highlightID) {
        CommentItem.highlighted = true;
      }

      if (isRealTime) {
        if (
          comment.createdTimestamp > RealtimeStore.lastCommentTimestamp &&
          userStore.postedCommentIDs.indexOf(CommentItem.data.id) === -1
        ) {
          CommentItem.highlighted = true;
        }
      }

      CommentItem.replies.push(
        ...CommentsStore.createCommentsWithRecursion(
          comment.replies,
          CommentItem.removeReply,
          CommentItem,
          highlightID,
          isRealTime
        )
      );

      return CommentItem;
    });
  }
}

decorate(CommentsStore, {
  _sortBy: observable,
  comments: observable,
  loading: observable,
  moreAvailable: observable,
  selectedComment: observable,
  totalComments: observable,
  firstChangeSort: observable,

  changeSorting: action,
  getCommentDetailsByID: action,
  initialLoadSuccess: action,
  loadMoreComments: action,
  removeComment: action,
});

export default new CommentsStore();
