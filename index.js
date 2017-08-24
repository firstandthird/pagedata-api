'use strict';

const wreck = require('wreck');
const version = require('./package.json').version;
const querystring = require('querystring');
const Boom = require('boom');

class PageData {
  constructor(host, key, userAgent) {
    this.options = {
      host,
      key,
      userAgent: userAgent || `pagedata-api/${version}`
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
    wreck.request(method, url, {
      payload: data ? JSON.stringify(data) : undefined,
      headers,
    }, (err, res) => {
      
      if (!err && res.statusCode >= 400) {
        err = Boom.create(res.statusCode);
      }

      if (err) {
        return done(err);
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
