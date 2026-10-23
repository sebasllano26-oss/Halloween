import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './helpers.js';

test('el enlace público permite votar sin invitación ni código', () => {
  const f = fixture(); const ballot = {...f.ballot(),name:'María Elena López'}; delete ballot.code;
  const result = f.service.handle('submit',ballot);
  assert.equal(result.status,'recorded'); assert.equal(f.state().responses.length,1);
  assert.deepEqual(f.service.handle('submit',ballot),result);
});

test('un nombre completo solo vota una vez, incluso con tildes, espacios o dispositivo distinto', () => {
  const f = fixture();
  f.service.handle('submit',{...f.ballot(),name:'María Elena López'});
  assert.throws(()=>f.service.handle('submit',{...f.ballot(),name:'  MARIA   ELENA LOPEZ  '}),e=>e.code==='VOTE_ALREADY_RECORDED');
  assert.equal(f.state().responses.length,1);
  f.service.handle('submit',{...f.ballot(),name:'Carlos Alberto López'});
  assert.equal(f.state().responses.length,2);
});
