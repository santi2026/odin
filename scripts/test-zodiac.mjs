import assert from 'node:assert/strict';
import {astronomicalConstellation,chineseSign,moonForDate,profileForDate,seasonForDate,westernSign} from '../preview-zodiac/zodiac-core.js';

assert.deepEqual(westernSign(11,14),{name:'Escorpio',symbol:'♏',element:'Agua',modality:'Fijo'});
assert.equal(westernSign(1,1).name,'Capricornio');
assert.equal(chineseSign(new Date(2024,1,9,12)).animal,'Conejo');
assert.equal(chineseSign(new Date(2024,1,10,12)).animal,'Dragón');
const ana=profileForDate('1979-11-14');
assert.equal(ana.chinese.animal,'Cabra');assert.equal(ana.chinese.element,'Tierra');assert.equal(ana.chinese.polarity,'Yin');
assert.equal(ana.traditions.stone,'Topacio');assert.equal(ana.traditions.flower,'Crisantemo');
assert.equal(astronomicalConstellation(11,14),'Libra');assert.equal(astronomicalConstellation(12,1),'Ofiuco');
assert.equal(seasonForDate(11,14,'north'),'Otoño');assert.equal(seasonForDate(11,14,'south'),'Primavera');
assert.ok(moonForDate(new Date(2000,0,6,18,14)).illumination<0.001);
console.log('ZODIAC_TESTS_OK');
