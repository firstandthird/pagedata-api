'use strict';

const wreck = require('wreck');
const version = require('./package.json').version;
const querystring = require('querystring');
const Boom = require('boom');

class PageData {
  constructor(host, key, userAgent, timeout) {
    this.options = {
      host,
      key,
      userAgent: userAgent || `pagedata-api/${version}`,
      timeout: timeout || 0
    };
  }

  request(method, endpoint, data, done) {
    const url = `${this.options.host}${endpoint}`;
    const headers = {
      'x-api-key': this.options.key
    };
    if (this.options.userAgent) {
      headers['user-agent'] = this.options.userAgent;
    }

    const reqOpts = {
      payload: data ? JSON.stringify(data) : undefined,
      headers
    };

    if (this.options.timeout) {
      reqOpts.timeout = this.options.timeout;
    }

    wreck.request(method, url, reqOpts, (err, res) => {
      if (err) {
        return done(err);
      }
      if (res.statusCode === 404) {
        return done(Boom.notFound());
      }
      wreck.read(res, { json: true }, (readErr, payload) => {
        if (readErr) {
          return done(Boom.wrap(readErr, res.statusCode));
        }
        done(null, payload);
      });
    });
  }

  get(endpoint, done) {
    this.request('get', endpoint, null, done);
  }

  post(endpoint, data, done) {
    this.request('post', endpoint, data, done);
  }

  put(endpoint, data, done) {
    this.request('put', endpoint, data, done);
  }

  getProjects(done) {
    this.get('/api/projects', done);
  }

  getPages(query, done) {
    if (typeof query === 'function') {
      done = query;
      query = {};
    }
    const qs = querystring.stringify(query);
    this.get(`/api/pages?${qs}`, done);
  }

  getPage(slug, query, done) {
    if (typeof query === 'function') {
      done = query;
      query = {};
    }
    const qs = querystring.stringify(query);
    this.get(`/api/pages/${slug}?${qs}`, done);
  }
}

module.exports = PageData;
