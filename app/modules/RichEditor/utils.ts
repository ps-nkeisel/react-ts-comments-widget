import { translation } from 'services/translation';
import urlSearchParams from 'services/urlSearchParams';
import { BoldIcon, CodeIcon, HashtagIcon, ItalicIcon, MentionIcon, QuoteIcon, UlIcon, UnderlineIcon, URLIcon } from './components/ToolbarIcons';

// TODO Convert API config string to number.
export enum FormattingOption {
  Bold = 'bold',
  Italic = 'italic',
  Underline = 'underline',
  URL = 'url',
  Blockquote = 'blockquote',
  Code = 'code',
  List = 'list',
  Image = 'image',
  GIF = 'gif',
  Hashtag = 'hashtag',
  Mention = 'mention',
}

export interface IFormattingOption {
  className: string;
  icon: string;
  title: string;
  type: string;
}

const allOptions: IFormattingOption[] = [
  { className: '', icon: '', title: '', type: FormattingOption.Image },
  { className: '', icon: '', title: '', type: FormattingOption.GIF },
  { className: 'ql-bold', icon: BoldIcon, title: translation.editorOptions.bold, type: FormattingOption.Bold },
  { className: 'ql-italic', icon: ItalicIcon, title: translation.editorOptions.italic, type: FormattingOption.Italic },
  {
    className: 'ql-underline',
    icon: UnderlineIcon,
    title: translation.editorOptions.underline,
    type: FormattingOption.Underline,
  },
  { className: 'ql-url', icon: URLIcon, title: translation.editorOptions.link, type: FormattingOption.URL },
  {
    className: 'ql-blockquote',
    icon: QuoteIcon,
    title: translation.editorOptions.blockquote,
    type: FormattingOption.Blockquote,
  },
  {
    className: 'ql-code-block',
    icon: CodeIcon,
    title: translation.editorOptions.code,
    type: FormattingOption.Code,
  },
  {
    className: 'ql-list',
    icon: UlIcon,
    title: translation.editorOptions.list,
    type: FormattingOption.List,
  },
  {
    className: 'ql-mention',
    icon: MentionIcon,
    title: translation.editorOptions.mention,
    type: FormattingOption.Mention,
  },
  {
    className: 'ql-hashtag',
    icon: HashtagIcon,
    title: translation.editorOptions.hashtag,
    type: FormattingOption.Hashtag,
  },
];

export const getAllowedFormattingOptions = (): IFormattingOption[] => {
  /**
   * Detect allowed formatting options.
   * If query param editorOptions exists we take options from there, otherwise
   * we enable all our formatting options
   */
  const editorOptions = urlSearchParams.get('editorOptions');
  const allowedFormattingOptions = editorOptions ? (editorOptions.split(',') as any) : Object.values(FormattingOption);
  return allOptions.filter((option) => allowedFormattingOptions.includes(option.type as FormattingOption));
};
