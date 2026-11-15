const LETTER_OR_NUMBER = /[\p{L}\p{N}]/u;

const STYLE_ALPHABETS = {
  script: {
    upper: '𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵',
    lower: '𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏'
  },
  bold: {
    upper: '𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙',
    lower: '𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳',
    digits: '𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗'
  },
  monospace: {
    upper: '𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉',
    lower: '𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣',
    digits: '𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿'
  }
};

function styleUnicode(text, style) {
  const alphabet = STYLE_ALPHABETS[style];
  if (!alphabet) return text;
  const upper = Array.from(alphabet.upper), lower = Array.from(alphabet.lower), digits = Array.from(alphabet.digits || '0123456789');
  return Array.from(text.normalize('NFD')).map(character => {
    if (/[A-Z]/.test(character)) return upper[character.charCodeAt(0) - 65];
    if (/[a-z]/.test(character)) return lower[character.charCodeAt(0) - 97];
    if (/\d/.test(character)) return digits[Number(character)];
    return character;
  }).join('');
}

function wordsForIdentifier(text) {
  return text.normalize('NFC').match(/[\p{L}\p{M}\p{N}]+/gu) || [];
}

function capitalize(word) {
  const characters = Array.from(word.toLocaleLowerCase('es'));
  return characters.length ? characters[0].toLocaleUpperCase('es') + characters.slice(1).join('') : '';
}

export function transformCase(text, mode) {
  const value = String(text ?? '');
  if (mode === 'upper') return value.toLocaleUpperCase('es');
  if (mode === 'lower') return value.toLocaleLowerCase('es');
  if (mode === 'title') return value.toLocaleLowerCase('es').replace(/[\p{L}\p{M}\p{N}]+/gu, capitalize);
  if (mode === 'sentence') {
    const lower = value.toLocaleLowerCase('es');
    let capitalizeNext = true;
    return Array.from(lower).map(character => {
      if (capitalizeNext && /\p{L}/u.test(character)) { capitalizeNext = false; return character.toLocaleUpperCase('es'); }
      if (/[.!?…]/u.test(character)) capitalizeNext = true;
      return character;
    }).join('');
  }
  const words = wordsForIdentifier(value);
  if (mode === 'camel') return words.map((word,index) => index ? capitalize(word) : word.toLocaleLowerCase('es')).join('');
  if (mode === 'pascal') return words.map(capitalize).join('');
  if (mode === 'snake') return words.map(word => word.toLocaleLowerCase('es')).join('_');
  if (mode === 'kebab') return words.map(word => word.toLocaleLowerCase('es')).join('-');
  if (mode === 'constant') return words.map(word => word.toLocaleUpperCase('es')).join('_');
  if (mode === 'reverse') return Array.from(value).reverse().join('');
  if (mode in STYLE_ALPHABETS) return styleUnicode(value,mode);
  return value;
}

function normalizedLines(text, { trim = true, removeEmpty = true } = {}) {
  let lines = String(text ?? '').replace(/\r\n?/g,'\n').split('\n');
  if (trim) lines = lines.map(line => line.trim());
  if (removeEmpty) lines = lines.filter(Boolean);
  return lines;
}

export function processList(text, options = {}) {
  const {
    action = 'asc', caseSensitive = false, trim = true, removeEmpty = true,
    unique = false, prefix = '', suffix = '', filter = '', filterMode = 'include',
    outputSeparator = '\n', random = Math.random
  } = options;
  let lines = normalizedLines(text,{trim,removeEmpty});
  const comparable = value => caseSensitive ? value : value.toLocaleLowerCase('es');
  if (filter) lines = lines.filter(line => (comparable(line).includes(comparable(filter))) === (filterMode !== 'exclude'));
  if (unique) {
    const seen = new Set();
    lines = lines.filter(line => { const key = comparable(line); if (seen.has(key)) return false; seen.add(key); return true; });
  }
  const collator = new Intl.Collator('es',{numeric:true,sensitivity:caseSensitive?'variant':'base'});
  if (action === 'asc') lines.sort(collator.compare);
  if (action === 'desc') lines.sort((a,b) => collator.compare(b,a));
  if (action === 'reverse') lines.reverse();
  if (action === 'shuffle') for (let index=lines.length-1;index>0;index-=1) { const other=Math.floor(random()*(index+1)); [lines[index],lines[other]]=[lines[other],lines[index]]; }
  const result = lines.map(line => `${prefix}${line}${suffix}`).join(outputSeparator);
  return { text:result, inputCount:normalizedLines(text,{trim,removeEmpty}).length, outputCount:lines.length };
}

function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }

export function replaceText(text, search, replacement = '', options = {}) {
  const source = String(text ?? ''), needle = String(search ?? '');
  if (!needle) return { text:source, count:0 };
  const expression = options.regex ? needle : escapeRegExp(needle);
  const flags = `${options.all === false ? '' : 'g'}${options.caseSensitive ? '' : 'i'}u`;
  const regex = new RegExp(expression,flags);
  let count = 0;
  const result = source.replace(regex,(...args) => {
    count += 1;
    if (!options.regex) return replacement;
    return replacement.replace(/\$(\d+|&)/g,(match,group) => group === '&' ? args[0] : (args[Number(group)] ?? ''));
  });
  return { text:result, count };
}

function segmentCount(text, granularity) {
  if (!text.trim()) return 0;
  if (typeof Intl.Segmenter === 'function') {
    const segments = new Intl.Segmenter('es',{granularity}).segment(text);
    if (granularity === 'word') return [...segments].filter(item => item.isWordLike).length;
    return [...segments].filter(item => item.segment.trim()).length;
  }
  return granularity === 'word' ? (text.match(/[\p{L}\p{N}]+/gu)||[]).length : (text.match(/[^.!?…]+[.!?…]?/gu)||[]).filter(item=>item.trim()).length;
}

function graphemeCount(text) {
  if (!text) return 0;
  if (typeof Intl.Segmenter === 'function') return [...new Intl.Segmenter('es',{granularity:'grapheme'}).segment(text)].length;
  return Array.from(text).length;
}

export function countText(text, wordsPerMinute = 200) {
  const value = String(text ?? ''), normalized=value.replace(/\r\n?/g,'\n');
  const words=segmentCount(normalized,'word'), sentences=segmentCount(normalized,'sentence');
  const paragraphs=normalized.trim() ? normalized.trim().split(/\n\s*\n+/).filter(item=>item.trim()).length : 0;
  const lines=normalized ? normalized.split('\n').length : 0;
  const bytes=new TextEncoder().encode(value).length;
  return {
    characters:graphemeCount(value),
    charactersNoSpaces:graphemeCount(value.replace(/\s/gu,'')),
    words,sentences,paragraphs,lines,bytes,
    readingSeconds:words ? Math.max(1,Math.ceil(words/Math.max(1,wordsPerMinute)*60)) : 0,
    averageWordLength:words ? Number(((value.match(/[\p{L}\p{N}]+/gu)||[]).reduce((sum,word)=>sum+Array.from(word).length,0)/words).toFixed(1)) : 0
  };
}

function uniqueValues(values, caseSensitive = false) {
  const seen=new Set();
  return values.filter(value=>{const key=caseSensitive?value:value.toLocaleLowerCase('es');if(seen.has(key))return false;seen.add(key);return true;});
}

export function extractContacts(text, options = {}) {
  const value=String(text ?? '');
  const emails=(value.match(/[\p{L}\p{N}.!#$%&'*+/=?^_`{|}~-]+@[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?(?:\.[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?)+/gu)||[])
    .map(item=>item.replace(/^[.,;:!?()[\]{}]+|[.,;:!?()[\]{}]+$/g,''));
  const urls=(value.match(/(?:https?:\/\/|www\.)[^\s<>"'`]+/giu)||[])
    .map(item=>item.replace(/[.,;:!?]+$/g,'').replace(/[)\]}]+$/g,''));
  const cleanEmails=options.unique===false?emails:uniqueValues(emails);
  const cleanUrls=options.unique===false?urls:uniqueValues(urls);
  if (options.sort) { const collator=new Intl.Collator('es',{numeric:true,sensitivity:'base'});cleanEmails.sort(collator.compare);cleanUrls.sort(collator.compare); }
  return { emails:cleanEmails, urls:cleanUrls };
}

export function cleanText(text, options = {}) {
  let value=String(text ?? '').replace(/\r\n?/g,'\n');
  if (options.invisible) value=value.replace(/[\u200B-\u200D\u2060\uFEFF]/g,'');
  if (options.normalizeUnicode) value=value.normalize('NFC');
  if (options.tabsToSpaces) value=value.replace(/\t/g,' '.repeat(Math.max(1,Number(options.tabSize)||2)));
  if (options.trimLines) value=value.split('\n').map(line=>line.trim()).join('\n');
  if (options.collapseSpaces) value=value.replace(/[ \t]{2,}/g,' ');
  if (options.removeBlankLines) value=value.replace(/\n[ \t]*\n+/g,'\n');
  if (options.joinLines) value=value.replace(/[ \t]*\n+[ \t]*/g,' ');
  if (options.trimDocument) value=value.trim();
  return value;
}

export function formatDuration(seconds) {
  if (!seconds) return '0 s';
  if (seconds < 60) return `${seconds} s`;
  const minutes=Math.floor(seconds/60),rest=seconds%60;
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
}
