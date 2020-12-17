/**
 * @file Contains translation object that we use inside our components, containers and stores.
 *
 * This object can be updated only once (when we receive postMessage on widget load) then function {@see updateTranslation}
 * is called to update {@see translation} object. Once this is done we manually rerender the whole app,
 * so components will be re-rendered with the updated {@see translation} values.
 */

// tslint:disable max-line-length object-literal-sort-keys
import merge from 'lodash/merge';

export let translation = {
  common: {
    name: 'Name',
    email: 'Email',
    password: 'Password',
    ageRange: 'Select your age range',
    writeComment: 'Write a comment',
    blankName: 'Name cannot be blank',
    blankEmail: 'Email cannot be blank',
    blankPassword: 'Password cannot be blank',
    blankComment: 'Comment cannot be blank',
    invalidEmail: 'Invalid email, please try again.',
    invalidName: 'The name should not contain numbers, URL, special characters or offensive words',
    reply: 'Reply', // used for action in comment/reply 'Reply [1]'
    replies: 'Replies',
    replyingTo: 'Replying to',
    report: 'Report Comment',
    or: 'or', // used in sign in [SOCIAL] or [NAME, EMAIL]
    to: 'to', // not needed // used in reply item - [reply icon] to Ross
    recommend: 'Recommend', // used for recommend item in header of widget
    recommended: 'Recommended', // used for recommend item in header of widget - when user recommended article
    readMore: 'Read more', // comment / reply text truncate to show more
    showLess: 'show less', // comment / reply text truncate to show less
    points: 'points',
    point: 'point', // added
    // badges
    moderator: 'Mod',
    // Buttons
    signIn: 'Sign in',
    signUp: 'Sign up',
    signInWith: 'Sign in with:',
    signInWithVuukle: 'or sign in using Vuukle:',
    signUpWithVuukle: 'or sign up with Vuukle:',
    share: 'Share',
    collapse: 'Collapse',
    expand: 'Expand',
    cancel: 'Cancel',
    remove: 'Remove',
    save: 'Save',
    edit: 'Edit',
    edited: 'edited', // comment edited status
    blockUser: 'Block User',
    privacyPolicy: 'Privacy Policy',
    agreeWithVuukle: `I agree with Vuukle's`,
  },
  profile: {
    myProfile: 'My Profile',
    myComments: 'My Comments',
    signOut: 'Sign out',
    settings: 'Settings',
  },
  toxicity: {
    long: 'probability perceived as "toxic"', // toxicity message for big screens: [percentage] + [long] -> 90% likely to be perceived as "toxic"
    messageTooLong: 'Characters limit exceeded. Please try to make your comment shorter or remove some symbols.', // this might be displayed if user added long text with not common symbols which might be calculated as few symbols in length
  },
  messages: {
    charlimits: 'The moderator has set a character limit up to',
    alreadyReported: 'You have already reported this comment to the moderator.',
    commentsClosed: 'Comments are now closed.',
    alreadySubmitted: 'Your comment has been already submitted for this article.',
    almostSame: 'Your previous comment was almost the same. Please write something different.', // Previous comment and new one are not passing difference of 25%
    flaggedMessage: 'Thanks, the moderator will be notified',
    errorSubmitting: 'There was an error while saving your comment, please refresh the page and try again',
    invalidLogin: 'Invalid login, please login again',
    spammerComment: 'Your comment is under moderation',
    moderationMessage:
      'Your comment is under moderation and will be approved by the site moderator. Thank you for your patience.',
    spamComment:
      'Seems like you are posting a spam comment. If you still want to send it just click on "POST" button again.',
    errorContactVuukle: 'Error! Please try again, if the issue persists, let our team know on support@vuukle.com',
    errorPosting: 'Error! Please try again, if the issue persists, <a target="_blank" href="https://docs.vuukle.com/why-cant-i-comment/">check our guide here</a>',
    // ADDED
    ownCommentVote: 'You cannot vote your own comment', // When user want to vote on his/her own comment
    alreadyVoted: 'You have already voted. You can click again to remove your vote.',
    commentAdded: 'Comment is successfully posted', // Comment has been added successfuly
    noComments: 'Be the first to comment', // Used to show 'Be the first to comment' instead comments if there is no comments
    noCommentsInSorting: 'No comments here', // Used in sorting category ( not latest ) to tell user that there is no comments
    flagQuestion: 'Do you want to report this comment?', // Used in confirm window after click on flag icon
    toxicityLimit: 'You cannot post comments with toxic probability of more than %d', // %d - is number position. i.e. if limit is 70% message will be: You cannot post comments with toxicity value more than 70%
    emailExists: 'This email is already registered, please click sign in instead',
    emailNotVerified: 'Your email is not verified.',
    signInQuestion: 'Already have an account?',
    signUpQuestion: `Don't have an account?`,
    missingPassword: 'Do not have a password?',
    forgotPassword: 'Forgot password?',
    verifyEmail: 'Click here to verify your email',
    passwordReset: 'Click here to reset password',
    incorrectDetails: 'Incorrect email or password.',
    blockedIp: 'Please contact site owner as they have banned your ip.',
    blockedEmail: 'Please contact site owner as they have banned your email.',
    blockedUser: 'This author is blocked',
    editingWithReplies: 'You cannot edit comments with replies.',
    protectedAction: 'This action requires password authentication.',
    userBlockConfirmation:
      'Are you sure you want to block this user?\n\nYou can manage blocked users inside the profile settings page.',
    removalConfirmation: 'Are you sure you want to delete the comment?',
    removedSuccessfully: 'Comment has been removed successfully! The comment will disappear in a few seconds.',
    removedComment: 'Comment removed by user',
    rejectedComment: 'Comment removed by moderator',
    youAreFollowing: 'You are now following',
    youAreNotFollowing: 'You are no longer following',
    errorSavingImage: 'Sorry, there was an error saving an image, please try try again',
    imageTooBig: 'The file size is too big, please upload an image below 5MB',
    unknownError: 'Error happened, please try again',
    wrongImageFormat: 'We can only accept the following image formats: .png .jpg .jpeg .bmp',
    nonAllowedImage: 'Upload error: This image has objectionable content.',
    guestLogin: `I'd rather post as a guest`,
    enableCookies: 'Please allow cookies in your browser settings for smooth functioning of the platform',
  },
  timeAgo: {
    seconds: 'now',
    minutes: '%dm',
    hours: '%dh',
    days: '%dd',
    months: '%dmo',
    years: '%dY',
    locale: 'en-US',
  },
  editorOptions: {
    gifSearch: 'Search GIFs via Giphy...',
    gifSearchResults: 'SEARCH RESULTS',
    gifTrending: 'TRENDING',
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    link: 'Create a link',
    blockquote: 'Quotation',
    code: 'Code',
    list: 'List',
    mention: 'Insert a @mention',
    hashtag: 'Insert a #hashtag',
  },
  shareIcons: {
    facebook: 'Share using Facebook',
    linkedin: 'Share using Linkedin',
    twitter: 'Share using Twitter',
  },
  login: {
    facebook: 'Login using Facebook',
    google: 'Login using Google',
    twitter: 'Login using Twitter',
    disqus: 'Login using Disqus',
    sso: 'Sign up to post',
  },
  commentText: {
    when1: 'Comment',
    whenX: 'Comments',
  },
  votesText: {
    when1: 'Vote',
    whenX: 'Votes',
  },
  followerText: {
    when1: 'Follower',
    whenX: 'Followers',
  },
  follow: 'Follow',
  unfollow: 'Unfollow',
  profileCard: {
    fullProfile: 'Full Profile',
  },
  sorting: {
    editorsPick: `Editor's Pick`,
    latest: 'Latest',
    more: 'More', // dropdown for filters: mostReplied, mostDisliked, oldest
    mostLiked: 'Best',
    mostReplied: 'Most Replied',
    oldest: 'Oldest',
    sortBy: 'Sort by',
  },
  buttons: {
    addComment: 'Add Comment',
    like: 'Like',
    liked: 'Liked',
    loadMore: 'Load more comments',
    post: 'Post',
    showMoreArticles: 'Show more articles',
    showComments: 'Show Comments',
  },
  footer: {
    addVuukle: 'Add Vuukle',
    privacy: 'Privacy',
  },
  moderation: {
    rejectComment: 'Reject Comment',
    commentIsRejected: '[Moderator] Comment has been rejected.',
  },
  notifications: {
    notifications: 'Notifications',
    likedYourComment: 'liked your comment in',
    dislikedYourComment: 'disliked your comment in',
    followingYou: 'just started following you.',
    repliedToYourComment: 'replied to your comment in',
    commentRejected: 'rejected your comment in',
    commentApproved: 'approved your comment in',
    markRead: 'Mark all as read',
    mentionedYou: 'mentioned you in',
    refreshNotifications: 'Refresh notifications',
    noNotifications: 'No notifications yet.',
    seeAll: 'See All',
    sentModeration: 'Your comment is under moderation in',
  },
  realtime: {
    someoneTyping: 'Someone is typing',
    loadNewMessage: 'Load %d new message',
    loadNewMessages: 'Load %d new messages',
    listening: 'People Listening',
  },
  recommendedStories: 'Talk of the town',
  searchComments: 'Search...',
};

/** Typed Translation */
export type translationType = typeof translation;

/**
 * Deeply merges passed new translation with the current one, replacing items in current translation
 * with new translation if they exist.
 *
 * @param {typeof translation} newTranslation
 * @return {typeof translation} updated translation
 */
export function updateTranslation(newTranslation: Partial<typeof translation>): typeof translation {
  translation = merge(translation, newTranslation) as typeof translation;
  return translation;
}
