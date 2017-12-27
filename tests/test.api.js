'use strict';
const code = require('code');   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hapi = require('hapi');
const PageData = require('../index.js');
const host = 'http://localhost:8000';
const key = 'theKey';
const userAgent = '007';

lab.test('will throw error if instantiated with invalid config', () => {
  const f = () => {
    const pagedata = new PageData({ blah: 'blarney' });
  };
  code.expect(f).to.throw();
});

lab.test('can instantiate the PageData API', async() => {
  const server = new Hapi.Server({ port: 8000 });
  await server.start();
  const pageData = new PageData({ host, key, userAgent });
  code.expect(typeof pageData).to.equal('object');
  code.expect(typeof pageData.getPages).to.equal('function');
  code.expect(typeof pageData.getPage).to.equal('function');
  code.expect(typeof pageData.getProjects).to.equal('function');
  code.expect(typeof pageData.get).to.equal('function');
  code.expect(typeof pageData.post).to.equal('function');
  code.expect(typeof pageData.put).to.equal('function');
  code.expect(typeof pageData.request).to.equal('function');
  code.expect(pageData.options.host).to.equal(host);
  code.expect(pageData.options.key).to.equal(key);
  code.expect(pageData.options.userAgent).to.equal(userAgent);
  server.stop();
});

lab.test('getPages', async() => {
  const server = new Hapi.Server({ port: 8000 });
  await server.start();
  server.route({
    path: '/api/pages',
    method: 'get',
    handler: (request, h) => {
      code.expect(request.headers).to.include('user-agent');
      code.expect(request.headers['user-agent']).to.equal(userAgent);
      code.expect(request.headers).to.include('x-api-key');
      code.expect(request.headers['x-api-key']).to.equal(key);
      code.expect(request.query.status).to.equal('draft');
      return { hello: 'world' };
    }
  });
  const pageData = new PageData({ host, key, userAgent });
  const result = await pageData.getPages({ name: 'mySite' });
  code.expect(result.hello).to.equal('world');
  await server.stop();
});

lab.test('get', async() => {
  const server = new Hapi.Server({ port: 8000 });
  await server.start();
  server.route({
    path: '/api/pages',
    method: 'GET',
    handler: (request, h) => {
      code.expect(request.headers).to.include('user-agent');
      code.expect(request.headers).to.include('x-api-key');
      return { payload: { hello: 'world' } };
    }
  });
  const pageData = new PageData({ host, key, userAgent });
  const result = await pageData.get('/api/pages');
  code.expect(result.payload.hello).to.equal('world');
  await server.stop();
});

lab.test('constructor takes a default status', async() => {
  const server = new Hapi.Server({ port: 8000 });
  await server.start();
  server.route({
    path: '/api/pages',
    method: 'GET',
    handler: (request, h) => {
      code.expect(request.headers).to.include('user-agent');
      code.expect(request.headers).to.include('x-api-key');
      code.expect(request.query.status).to.equal('published');
      return { payload: { hello: 'world' } };
    }
  });
  const pageData = new PageData({ host, key, userAgent, status: 'published' });
  const result = await pageData.getPages({ name: 'mySite' });
  code.expect(result.payload.hello).to.equal('world');
  await server.stop();
});
