import { AppController } from './app.controller.js';

describe('AppController', () => {
  it('health devuelve status ok', () => {
    expect(new AppController().getHealth()).toEqual({ status: 'ok' });
  });
});
