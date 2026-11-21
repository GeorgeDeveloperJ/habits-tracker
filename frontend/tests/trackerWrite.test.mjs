import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runTrackerWrite } from '../src/context/trackerWrite.ts';

test('a committed goal stays confirmed when the progress refresh fails', async () => {
  let writes = 0;
  const result = await runTrackerWrite(async () => { writes++; }, async () => {
    throw new Error('connection lost during refresh');
  });
  assert.equal(result, 'saved-stale');
  assert.equal(writes, 1);
});

test('a lost close-day response requests a status check without replaying the write', async () => {
  let writes = 0;
  const result = await runTrackerWrite(async () => {
    writes++;
    throw new Error('connection lost');
  }, async () => assert.fail('status check must be explicit'));
  assert.equal(result, 'unconfirmed');
  assert.equal(writes, 1);
});

test('a backend validation rejection is surfaced to the caller', async () => {
  const rejection = { response: { status: 400, data: { message: 'Plan all eight pillars' } } };
  await assert.rejects(runTrackerWrite(async () => { throw rejection; }, async () => {
    assert.fail('rejected writes should not refresh');
  }), (error) => error === rejection);
});
