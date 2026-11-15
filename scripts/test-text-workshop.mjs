import assert from 'node:assert/strict';
import { cleanText, countText, extractContacts, processList, replaceText, transformCase } from '../preview-text-workshop/text-workshop-core.js';

assert.equal(transformCase('hola MUNDO','upper'),'HOLA MUNDO');
assert.equal(transformCase('hOLA mUNDO. oTRA FRASE!','sentence'),'Hola mundo. Otra frase!');
assert.equal(transformCase('Hola, mundo útil','camel'),'holaMundoÚtil');
assert.equal(transformCase('Hola, mundo útil','snake'),'hola_mundo_útil');
assert.equal(transformCase('Ab1','script'),'𝒜𝒷1');
assert.equal(transformCase('Ab1','bold'),'𝐀𝐛𝟏');
assert.equal(transformCase('Árbol Ñ','script'),'𝒜́𝓇𝒷ℴ𝓁 𝒩̃');

const sorted=processList('Elemento 10\nelemento 2\nElemento 2\nElemento 1',{action:'asc',unique:true});
assert.equal(sorted.text,'Elemento 1\nelemento 2\nElemento 10');
assert.equal(sorted.inputCount,4);
assert.equal(sorted.outputCount,3);
assert.equal(processList('Ana\nLuis\nMarta',{action:'keep',filter:'a',filterMode:'include'}).text,'Ana\nMarta');
assert.equal(processList(' uno \n\n dos ',{action:'keep',trim:true,removeEmpty:true,prefix:'[',suffix:']',outputSeparator:'; '}).text,'[uno]; [dos]');

assert.deepEqual(replaceText('uno UNO uno','uno','dos',{caseSensitive:false,all:true}),{text:'dos dos dos',count:3});
assert.deepEqual(replaceText('A-12 B-35','([A-Z])-(\\d+)','$1:$2',{regex:true,all:true}),{text:'A:12 B:35',count:2});
assert.deepEqual(replaceText('uno uno','uno','dos',{all:false,caseSensitive:true}),{text:'dos uno',count:1});

const counts=countText('Hola mundo.\n\nOtra frase.');
assert.equal(counts.characters,24);
assert.equal(counts.words,4);
assert.equal(counts.sentences,2);
assert.equal(counts.paragraphs,2);
assert.equal(counts.lines,3);
assert.equal(countText('mañana será otro día').words,4);
assert.equal(countText('👨‍👩‍👧‍👦').characters,1);

const extracted=extractContacts('Escribe a Uno@Ejemplo.com, uno@ejemplo.com o visita https://odin.example/ruta?x=1. También www.ejemplo.es/ayuda.');
assert.deepEqual(extracted.emails,['Uno@Ejemplo.com']);
assert.deepEqual(extracted.urls,['https://odin.example/ruta?x=1','www.ejemplo.es/ayuda']);
assert.deepEqual(extractContacts('https://uno.es, https://uno.es! www.dos.es).',{sort:true}).urls,['https://uno.es','www.dos.es']);

assert.equal(cleanText('  Hola   mundo  \n\n\u200B Otra  ',{trimLines:true,collapseSpaces:true,removeBlankLines:true,invisible:true,trimDocument:true}),'Hola mundo\nOtra');
assert.equal(cleanText('uno\ndos',{joinLines:true}),'uno dos');

console.log('TEXT_WORKSHOP_TESTS=PASS');
