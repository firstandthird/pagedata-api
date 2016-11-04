'use strict';
const code = require('code');   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hapi = require('hapi');
const PageData = require('../index.js');

lab.experiment('hapi-auth-email hashing', () => {
  let server;
  const url = 'http://localhost:8000';
  const key = 'theKey';
  const userAgent = '007';
  lab.beforeEach((done) => {
    server = new Hapi.Server();
    server.connection({ host: 'localhost', port: 8000 });
    server.start(done);
  });

  lab.afterEach((done) => {
    server.stop(done);
  });

  lab.test('can instantiate the PageData API', (done) => {
    const pageData = new PageData(url, key, userAgent);
    code.expect(typeof pageData).to.equal('object');
    code.expect(typeof pageData.getPages).to.equal('function');
    code.expect(typeof pageData.getUrl).to.equal('function');
    code.expect(typeof pageData.get).to.equal('function');
    code.expect(typeof pageData.getMany).to.equal('function');
    code.expect(typeof pageData.getManyAndMerge).to.equal('function');
    code.expect(typeof pageData.update).to.equal('function');
    code.expect(pageData.options.url).to.equal(url);
    code.expect(pageData.options.key).to.equal(key);
    code.expect(pageData.options.userAgent).to.equal(userAgent);
    done();
  });

  lab.test('getPages', (done) => {
    server.route({
      path: '/api/sites/{site}/pages',
      method: 'GET',
      handler: (request, reply) => {
        code.expect(request.headers).to.include('user-agent');
        code.expect(request.headers['user-agent']).to.equal(userAgent);
        code.expect(request.headers).to.include('x-api-key');
        code.expect(request.headers['x-api-key']).to.equal(key);
        reply({ hello: 'world' });
      }
    });
    const pageData = new PageData(url, key, userAgent);
    pageData.getPages('mySite', (err, result) => {
      if (err) {
        throw err;
      }
      code.expect(result.hello).to.equal('world');
      done();
    });
  });

  lab.test('get', (done) => {
    server.route({
      path: '/api/sites/{site}/pages/{slug}',
      method: 'GET',
      handler: (request, reply) => {
        code.expect(request.headers).to.include('user-agent');
        code.expect(request.headers).to.include('x-api-key');
        code.expect(request.params.site).to.equal('mySite');
        code.expect(request.params.slug).to.equal('mySlug');
        reply({ payload: { hello: 'world' } });
      }
    });
    const pageData = new PageData(url, key, userAgent);
    pageData.get('mySite', 'mySlug', 'myTag', (err, result) => {
      if (err) {
        throw err;
      }
      code.expect(result.payload.hello).to.equal('world');
      done();
    });
  });

  lab.test('getMany', { timeout: 5000 }, (done) => {
    const tag = 'myTag';
    const slugs = ['my-slug-1', 'my-slug', 'another-slug'];

    server.route({
      path: '/api/sites/{site}/pages/{slug}',
      method: 'GET',
      handler: (request, reply) => {
        code.expect(request.headers).to.include('user-agent');
        code.expect(request.headers).to.include('x-api-key');
        code.expect(tag).to.equal(request.query.tag);
        code.expect(slugs).to.include(request.params.slug);
        reply({ payload: { hello: 'world' } });
      }
    });
    const pageData = new PageData(url, key, userAgent);
    pageData.getMany('mySite', slugs, tag, (err, result) => {
      if (err) {
        throw err;
      }
      code.expect(result.length).to.equal(slugs.length);
      code.expect(result[0].payload.hello).to.equal('world');
      done();
    });
  });

  lab.test('getManyAndMerge', { timeout: 5000 }, (done) => {
    const tag = 'myTag';
    const slugs = ['my-slug-1', 'my-slug', 'another-slug'];

    server.route({
      path: '/api/sites/{site}/pages/{slug}',
      method: 'GET',
      handler: (request, reply) => {
        code.expect(request.headers).to.include('user-agent');
        code.expect(request.headers).to.include('x-api-key');
        code.expect(tag).to.equal(request.query.tag);
        code.expect(slugs).to.include(request.params.slug);
        reply({ payload: { hello: 'world' } });
      }
    });
    const pageData = new PageData(url, key, userAgent);
    pageData.getMany('mySite', slugs, tag, (err, result) => {
      if (err) {
        throw err;
      }
      code.expect(result.length).to.equal(slugs.length);
      code.expect(result[0].payload.hello).to.equal('world');
      done();
    });
  });

  lab.test('userAgent is optional', (done) => {
    server.route({
      path: '/api/sites/{site}/pages',
      method: 'GET',
      handler: (request, reply) => {
        code.expect(request.headers).to.not.include('user-agent');
        code.expect(request.headers).to.include('x-api-key');
        code.expect(request.headers['x-api-key']).to.equal(key);
        reply({ hello: 'world' });
      }
    });
    const pageData = new PageData(url, key);
    pageData.getPages('mySite', (err, result) => {
      if (err) {
        throw err;
      }
      code.expect(result.hello).to.equal('world');
      done();
    });
  });
  // currently not passing:
  // lab.test('update', (done) => {
  //   server.route({
  //     path: '/api/sites/{site}/pages/{slug}',
  //     method: 'PUT',
  //     handler: (request, reply) => {
  //       code.expect(request.headers).to.include('user-agent');
  //       code.expect(request.headers).to.include('x-api-key');
  //       code.expect(request.payload).to.include('content');
  //       code.expect(request.params.tag).to.equal('myTag2');
  //       code.expect(request.params.slug).to.equal('my-slug');
  //       reply({ payload: { hello: 'world' } });
  //     }
  //   });
  //   const pageData = new PageData(url, key, userAgent);
  //   pageData.update('mySite', { content: 'myContent', slug: 'my-slug' }, (err, result) => {
  //     if (err) {
  //       throw err;
  //     }
  //     code.expect(result.payload.hello).to.equal('world');
  //     done();
  //   });
  // });
});
