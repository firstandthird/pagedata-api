'use strict';
const code = require('code');   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hapi = require('hapi');
const PageData = require('../index.js');
const host = 'http://localhost:8000';
const key = 'theKey';
const userAgent = '007';
const boom = require('boom');

lab.test('will throw error if instantiated with invalid config', () => {
  const f = () => {
    new PageData({ blah: 'blarney' });
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

lab.test('getMultiplePages', async() => {
  const server = new Hapi.Server({ port: 8000 });
  await server.start();
  server.route({
    path: '/api/pages/{slug}',
    method: 'get',
    handler: (request, h) => {
      if (request.params.slug === 'sgff-common') {
        return { content: { test: 123 } };
      }
      if (request.params.slug === 'sgff-page1') {
        return { content: { headline: 'this is a headline' } };
      }
      return { content: { slug: request.params.slug, query: request.query } };
    }
  });
  const pageData = new PageData({ host, key, userAgent });
  const result = await pageData.getMultiplePages(['slug1', 'slug2'], { findIt: 2 });
  code.expect(result.slug1.content.slug).to.equal('slug1');
  code.expect(result.slug1.content.query.findIt).to.equal('2');
  code.expect(result.slug2.content.slug).to.equal('slug2');
  // with mapping:
  const pages = await pageData.getMultiplePages(['sgff-common', 'sgff-page1'], {}, { common: 'sgff-common', content: 'sgff-page1' });
  code.expect(pages.common.test).to.equal(123);
  code.expect(pages.content.headline).to.equal('this is a headline');
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

lab.test('support retries on 502, 503 and 504 errors', { timeout: 5000 }, async() => {
  const server = new Hapi.Server({ port: 8000 });
  await server.start();
  const counts = {
    e502: false,
    e503: false,
    e504: false
  };
  server.route({
    path: '/api/502',
    method: 'GET',
    handler: (request, h) => {
      if (!counts.e502) {
        counts.e502 = true;
        throw boom.badGateway('a 502 error');
      }
      return { payload: { hello: 'world' } };
    }
  });
  server.route({
    path: '/api/503',
    method: 'GET',
    handler: (request, h) => {
      if (!counts.e503) {
        counts.e503 = true;
        throw boom.serverUnavailable('a 503 error');
      }
      return { payload: { hello: 'world2' } };
    }
  });
  server.route({
    path: '/api/504',
    method: 'GET',
    handler: (request, h) => {
      if (!counts.e504) {
        counts.e504 = true;
        throw boom.gatewayTimeout('a 504 error');
      }
      return { payload: { hello: 'world3' } };
    }
  });
  server.route({
    path: '/api/broke',
    method: 'GET',
    handler: (request, h) => {
      throw boom.gatewayTimeout('a 504 error');
    }
  });
  const pageData = new PageData({ host, key, userAgent, retryOnGet: 1 });
  let result = await pageData.get('/api/502');
  code.expect(result.payload.hello).to.equal('world');
  code.expect(counts.e502).to.equal(true);
  result = await pageData.get('/api/503');
  code.expect(result.payload.hello).to.equal('world2');
  code.expect(counts.e503).to.equal(true);
  result = await pageData.get('/api/504');
  code.expect(result.payload.hello).to.equal('world3');
  code.expect(counts.e504).to.equal(true);
  try {
    result = await pageData.get('/api/broke');
  } catch (e) {
    code.expect(e.output.statusCode).to.equal(504);
  }
  await server.stop();
});

lab.test('failed retries passes back original error', { timeout: 5000 }, async() => {
  const server = new Hapi.Server({ port: 8000 });
  await server.start();
  server.route({
    path: '/api/502',
    method: 'GET',
    handler: (request, h) => {
      throw boom.badGateway('a 502 error');
    }
  });
  const pageData = new PageData({ host, key, userAgent, retryOnGet: 1 });
  try {
    await pageData.get('/api/502');
  } catch (e) {
    code.expect(e).exists();
    code.expect(e.isBoom).to.be.true();
    code.expect(e.output.statusCode).to.equal(502);
  }
  await server.stop();
});
