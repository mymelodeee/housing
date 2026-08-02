process.env.PORT = '3000';
process.env.POSTGRES_CONNECTION_STRING = 'postgresql://test';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.DATA_APT_KR_API_KEY = process.env.DATA_APT_KR_API_KEY || 'test-key';
process.env.DATA_STORE_API_KEY = process.env.DATA_STORE_API_KEY || 'test-key';

const request = require('supertest');
const app = require('../../src/app');

describe('app', () => {
  it('존재하지 않는 경로 요청 시 404와 JSON { message }를 응답한다', async () => {
    const res = await request(app).get('/nope');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toEqual({ message: expect.any(String) });
  });

  it('GET /health가 구현되어 있다면 200을 응답한다', async () => {
    const res = await request(app).get('/health');

    if (res.status === 404) {
      return;
    }

    expect(res.status).toBe(200);
  });

  it('허용된 origin으로 요청하면 access-control-allow-origin 헤더가 포함된다', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173');

    expect(res.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173'
    );
  });

  it('허용되지 않은 origin으로 요청하면 access-control-allow-origin 헤더가 없거나 다르다', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://evil.com');

    expect(res.headers['access-control-allow-origin']).not.toBe(
      'http://evil.com'
    );
  });
});
