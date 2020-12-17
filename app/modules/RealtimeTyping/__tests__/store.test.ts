import commentsStore, { SortingType } from 'modules/CommentList/store';
import widgetStore from 'stores/widgetStore';

commentsStore.sortBy = SortingType.Latest;
widgetStore.realtime = true;
jest.mock('modules/CommentList/store');
jest.mock('stores/authStore');
import RealtimeStorage from '../store';

describe('editItem', () => {
  beforeEach(() => {
    commentsStore.totalComments = 0;
  });

  /**
   * Tests `writingUsers` property
   */
  describe('[writingUsers] Props', () => {
    it('should update the counter based on passed number', () => {
      RealtimeStorage.writingUsers = [{ commentId: -1, writingCommentCount: 2 }];
      expect(RealtimeStorage.writingUsersNumber).toEqual(2);
    });

    it('should substruct 1 from the counter if current user is writing', () => {
      RealtimeStorage.currentUserWriting = true;
      RealtimeStorage.writingUsers = [{ commentId: -1, writingCommentCount: 2 }];
      expect(RealtimeStorage.writingUsersNumber).toEqual(1);
    });
  });

  /**
   * Tests `newCommentsCount` property
   */
  describe('[newCommentsCount] calculation', () => {
    beforeEach(() => (commentsStore.totalComments = 50));

    it('should be 0 if both total comments and new comments count (received count) are equal', () => {
      RealtimeStorage.newCommentsCount = 50;
      expect(RealtimeStorage.newCommentsCount).toEqual(0);
    });

    it('should calculate the difference if total comments and new comments count are different', () => {
      RealtimeStorage.newCommentsCount = 53;
      expect(RealtimeStorage.newCommentsCount).toEqual(3);
    });

    it('should not show the negative numbers if we received new comments count less than total comments count', () => {
      RealtimeStorage.newCommentsCount = 40;
      expect(RealtimeStorage.newCommentsCount).toEqual(0);
    });
  });

  it('should reset new comments counter if resetCounter is called', () => {
    RealtimeStorage.newCommentsCount = 500;
    expect(RealtimeStorage.newCommentsCount).toEqual(500);
    RealtimeStorage.resetCounter();
    expect(RealtimeStorage.newCommentsCount).toEqual(0);
  });

  test.todo('Write unit tests for activeCount, typingUsers');
});
