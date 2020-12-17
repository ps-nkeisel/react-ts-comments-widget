/**
 * Taken from https://github.com/Weavy/quill-autoformat/blob/master/src/modules/autoformat.js
 * Has been modified to remove some the functionality the original module had and add 2 parameters
 *
 * Turns found strings into quill formats. Currently only used for hashtag.
 */

import Quill from 'quill';
import deviceInfo from 'services/deviceInfo';

const Module = Quill.import('core/module');
const Delta = Quill.import('delta');

class Autoformat extends Module {
  constructor(public quill: any, options: any) {
    super(quill, options);
    this.transforms = options;
    // Binds autoformat transforms to typing and pasting
    this.registerTypeListener();
    this.registerPasteListener();
  }

  public registerPasteListener() {
    // tslint:disable-next-line: forin
    for (const name in this.transforms) {
      const transform = this.transforms[name];
      this.quill.clipboard.addMatcher(Node.TEXT_NODE, (node: any, delta: any) => {
        if (typeof node.data !== 'string') {
          return;
        }

        delta.ops.forEach((op: any, index: any, deltaOps: any) => {
          // Find insert string ops
          if (typeof op.insert === 'string') {
            const changeDelta = makeTransformedDelta(transform, op.insert, undefined);
            const composedDelta = new Delta([op]).compose(changeDelta);

            // Replace the current op with transformed ops
            deltaOps.splice(index, 1, ...composedDelta.ops);
          }
        });

        return delta;
      });
    }
  }

  public registerTypeListener() {
    this.quill.on('text-change', (delta: any, oldDelta: any, source: any) => {
      const ops = delta.ops;
      if (source !== 'user' || !ops || ops.length < 1) {
        return;
      }

      // Check last insert
      let lastOpIndex = ops.length - 1;
      let lastOp = ops[lastOpIndex];

      while (!lastOp.insert && lastOpIndex > 0) {
        lastOpIndex--;
        lastOp = ops[lastOpIndex];
      }

      if (!lastOp.insert || typeof lastOp.insert !== 'string') {
        return;
      }
      const isEnter = lastOp.insert === '\n';

      // Get selection
      const sel = this.quill.getSelection();
      if (!sel) {
        return;
      }
      const endSelIndex = this.quill.getLength() - sel.index - (isEnter ? 1 : 0);

      // Get leaf
      const checkIndex = sel.index;
      const [leaf] = this.quill.getLeaf(checkIndex);

      if (!leaf || !leaf.text) {
        return;
      }

      const leafIndex = leaf.offset(leaf.scroll);
      const leafSelIndex = checkIndex - leafIndex;

      let transformed = false;

      // Check transforms
      // tslint:disable-next-line: forin
      for (const name in this.transforms) {
        const transform = this.transforms[name];

        // Check transform trigger
        if (lastOp.insert.match(transform.trigger || /./)) {
          let newOps = new Delta().retain(leafIndex);
          const transformOps = makeTransformedDelta(transform, leaf.text, leafSelIndex);

          if (transformOps) {
            newOps = newOps.concat(transformOps);
          }

          this.quill.updateContents(newOps, 'api');
          transformed = true;
        }
      }

      // Restore cursor position
      if (transformed) {
        setTimeout(() => {
          this.quill.setSelection(this.quill.getLength() - endSelIndex, 'api');
        }, 0);
      }
    });
  }
}

function getFormat(transform: any, match: any) {
  let format = {};

  if (typeof transform.format === 'string') {
    format[transform.format] = match;
  } else if (typeof transform.format === 'object') {
    format = transform.format;
  }

  return format;
}

function transformMatch(transform: any, match: any) {
  const find = new RegExp(transform.extract || transform.find);
  return transform.transform ? match.replace(find, transform.transform) : match;
}

function applyExtract(transform: any, match: any) {
  // Extract
  if (transform.extract) {
    const extract = new RegExp(transform.extract);
    const extractMatch = extract.exec(match[0]);

    if (!extractMatch || !extractMatch.length) {
      return match;
    }

    extractMatch.index += match.index;
    return extractMatch;
  }

  return match;
}

function makeTransformedDelta(transform: any, text: any, atIndex: any) {
  if (!transform.find.global) {
    /** Edge simply doesn't support RegExp flags in constructor. Only experimental support which is toggled in settings */
    deviceInfo.isEdge
      ? (transform.find = new RegExp(transform.find))
      : (transform.find = new RegExp(transform.find, transform.find.flags + 'g'));
  }

  transform.find.lastIndex = 0;

  let ops = new Delta();
  let findResult = null;
  const checkAtIndex = atIndex !== undefined && atIndex !== null;

  if (checkAtIndex) {
    // find match at index
    findResult = transform.find.exec(text);

    while (findResult && findResult.length && findResult.index < atIndex) {
      const isAppropriateLength =
        findResult[0].trim().length - 1 >= transform.minLength &&
        findResult[0].trim().length - 1 <= transform.maxLength;
      if (findResult.index < atIndex && findResult.index + findResult[0].length + 1 >= atIndex && isAppropriateLength) {
        ops = ops.concat(transformedMatchOps(transform, findResult).ops);
        break;
      } else {
        findResult = transform.find.exec(text);
      }
    }
  } else {
    // find all matches
    // tslint:disable-next-line: no-conditional-assignment
    while ((findResult = transform.find.exec(text)) !== null) {
      const transformedMatch = transformedMatchOps(transform, findResult);
      ops = ops.concat(transformedMatch.ops);
      text = text.substr(transformedMatch.rightIndex);
      transform.find.lastIndex = 0;
    }
  }

  return ops;
}

function transformedMatchOps(transform: any, result: any) {
  result = applyExtract(transform, result);

  const resultIndex = result.index;
  const transformedMatch = transformMatch(transform, result[0]);

  let insert = transformedMatch;

  if (transform.insert) {
    insert = {};
    insert[transform.insert] = transformedMatch;
  }

  const format = getFormat(transform, transformedMatch);

  const ops = new Delta();

  ops
    .retain(resultIndex)
    .delete(result[0].length)
    .insert(insert, format);

  const rightIndex = resultIndex + result[0].length;

  return {
    ops,
    rightIndex,
  };
}

Autoformat.DEFAULTS = {
  hashtag: {
    trigger: /[\s.,;:!?]/,
    find: /(?:^|\s)#[^\s.,;:!?]+/i,
    extract: /#([^\s.,;:!?]+)/i,
    transform: '$1',
    insert: 'hashtag',
    minLength: 3,
    maxLength: 100,
  },
};

export default Autoformat;
