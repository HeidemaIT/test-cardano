import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('echo', () => {
  it('echoes message when valid', async () => {
    const res = await request(app).post('/echo').send({ message: 'hi' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ echo: 'hi' });
  });

  it('fails when invalid body', async () => {
    const res = await request(app).post('/echo').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid request body');
  });
});
