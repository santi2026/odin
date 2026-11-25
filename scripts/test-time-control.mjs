import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {applySections,buildBackup,readSection,resetSections} from '../preview-admin/admin-core.js';

const values=new Map();
const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
const events=[];
const windowMock={dispatchEvent:event=>events.push(event.type),addEventListener(){}};
const documentMock={querySelector:()=>null};
const source=(await readFile(new URL('../time-center.js',import.meta.url),'utf8')).replace(/^import .*;\s*$/gm,'');
const context=vm.createContext({localStorage:storage,window:windowMock,document:documentMock,Event,Date,Intl,URL,console});
vm.runInContext(`${source}\nglobalThis.toggle=tcToggleTimer;globalThis.openNavigation=tcOpenNavigation;`,context);

const now=Date.now();
storage.setItem('odin-timer-v1',JSON.stringify({timer:{running:true,endAt:now+60000,remaining:60000,duration:60000},stopwatch:{running:false,accumulated:4500,startedAt:0,laps:[1000]},settings:{soundEnabled:true}}));
context.toggle('timer');
let state=JSON.parse(storage.getItem('odin-timer-v1'));
assert.equal(state.timer.running,false);assert.ok(state.timer.remaining>59000&&state.timer.remaining<=60000);assert.deepEqual(state.stopwatch.laps,[1000]);assert.equal(state.settings.soundEnabled,true);assert.equal(events.at(-1),'odin:timer-updated');
context.toggle('timer');state=JSON.parse(storage.getItem('odin-timer-v1'));assert.equal(state.timer.running,true);assert.ok(state.timer.endAt>Date.now());
context.toggle('stopwatch');state=JSON.parse(storage.getItem('odin-timer-v1'));assert.equal(state.stopwatch.running,true);assert.equal(state.stopwatch.accumulated,4500);
context.toggle('stopwatch');state=JSON.parse(storage.getItem('odin-timer-v1'));assert.equal(state.stopwatch.running,false);assert.ok(state.stopwatch.accumulated>=4500);assert.deepEqual(state.stopwatch.laps,[1000]);
state.timer={...state.timer,running:true,endAt:Date.now()-1};storage.setItem('odin-timer-v1',JSON.stringify(state));const expired=storage.getItem('odin-timer-v1');context.toggle('timer');assert.equal(storage.getItem('odin-timer-v1'),expired);
storage.setItem('odin-focus-v1',JSON.stringify({settings:{sessions:4},session:{running:true,endAt:Date.now()+30000,remaining:30000,phase:'focus'},history:[123]}));context.toggle('focus');const focus=JSON.parse(storage.getItem('odin-focus-v1'));assert.equal(focus.session.running,false);assert.ok(focus.session.remaining>0);assert.deepEqual(focus.history,[123]);assert.equal(events.at(-1),'odin:focus-updated');
const preferences={size:'mini',clockStyle:'flip',timer:true,alarms:false};storage.setItem('odin-time-control-v1',JSON.stringify(preferences));assert.deepEqual(readSection(storage,'centro_tiempo'),preferences);const backup=buildBackup(storage,['centro_tiempo']);assert.deepEqual(backup.secciones.centro_tiempo,preferences);resetSections(storage,['centro_tiempo']);assert.equal(storage.getItem('odin-time-control-v1'),null);applySections(storage,backup.secciones,['centro_tiempo']);assert.deepEqual(readSection(storage,'centro_tiempo'),preferences);
const navigation=[],host={open:(...args)=>{navigation.push(args);return {focus:()=>navigation.push('focus')};}};
context.openNavigation('/preview-timer/',host);context.openNavigation('/preview-alarms/',host);assert.deepEqual(navigation,[['/preview-timer/','odin-time-control-navigation'],'focus',['/preview-alarms/','odin-time-control-navigation'],'focus']);
console.log('TIME_CONTROL_TESTS=PASS');
