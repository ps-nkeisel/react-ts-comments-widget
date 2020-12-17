import Quill from 'quill';
import { css } from 'styled-components';

import HashtagsBlot from './hashtags/HashtagsBlot';
import AutoformatModule from './hashtags/AutoformatModule';
import Mention from './mentions/MentionModule';
import MentionBlot from './mentions/MentionBlot';
import UrlBlot from './url/URLBlot';
export * from './url/handler';
export * from './hashtags/handler';
export * from './mentions/handler';
export * from './styles';

/** Register Quill Blots */
Quill.register(UrlBlot);
Quill.register(MentionBlot);
Quill.register(HashtagsBlot);
/** Register Modules */
Quill.register('modules/autoformat', AutoformatModule);
Quill.register('modules/mention', Mention);

/** Styles */
import mentionStyles from './mentions/styles';
import globalQuillStyles from './styles';

export const quillStyles = css`
  ${globalQuillStyles}
  ${mentionStyles}
`;

export default Quill;
