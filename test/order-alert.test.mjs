import test from 'node:test';
import assert from 'node:assert/strict';
import { OrderAlert } from '../src/infrastructure/audio/order-alert.ts';

test('reutiliza o mesmo AudioContext e compartilha a retomada', async (t) => {
  const original = globalThis.AudioContext;
  let created = 0;
  let resumes = 0;
  class FakeAudioContext {
    state = 'suspended';
    constructor() { created++; }
    async resume() { resumes++; this.state = 'running'; }
    async close() { this.state = 'closed'; }
  }
  globalThis.AudioContext = FakeAudioContext;
  t.after(() => { globalThis.AudioContext = original; });
  const alert = new OrderAlert();
  await Promise.all([alert.enable(), alert.enable(), alert.enable()]);
  assert.equal(created, 1);
  assert.equal(resumes, 1);
  assert.equal(alert.isReady(), true);
  await alert.enable();
  assert.equal(resumes, 1);
  alert.close();
});

test('retenta uma ativação que o navegador recusou', async (t) => {
  const original = globalThis.AudioContext;
  let attempts = 0;
  class FakeAudioContext {
    state = 'suspended';
    async resume() {
      attempts++;
      if (attempts === 1) throw new Error('bloqueado');
      this.state = 'running';
    }
    async close() { this.state = 'closed'; }
  }
  globalThis.AudioContext = FakeAudioContext;
  t.after(() => { globalThis.AudioContext = original; });
  const alert = new OrderAlert();
  await assert.rejects(alert.enable(), /bloqueado/);
  await alert.enable();
  assert.equal(attempts, 2);
  assert.equal(alert.isReady(), true);
  alert.close();
});
