'use strict';

const wreck = require('wreck');
const async = require('async');
const defaults = require('lodash.defaultsdeep');
const version = require('./package.json').version;

class PageData {
  constructor(url, key, userAgent) {
    this.options = {
      url,
      key,
      userAgent: userAgent || `pagedata-api/${version}`
    };
  }
  getPages(site, done) {
    const url = `${this.options.url}/api/sites/${site}/pages`;
    const headers = {
      'x-api-key': this.options.key
    };
    if (this.options.userAgent) {
      headers['user-agent'] = this.options.userAgent;
    }
    wreck.get(url, {
      json: true,
      headers,
    }, (err, res, payload) => {
      if (err) {
        return done(err);
      }
      done(null, payload);
    });
  }

  getUrl(site, slug, tag) {
    return `${this.options.url}/api/sites/${site}/pages/${slug}?tag=${tag}`;
  }

  get(site, slug, tag, cb) {
    if (typeof tag === 'function') {
      cb = tag;
      tag = '';
    }
    const url = this.getUrl(site, slug, tag);
    const headers = {
      'x-api-key': this.options.key
    };
    if (this.options.userAgent) {
      headers['user-agent'] = this.options.userAgent;
    }
    wreck.get(url, {
      json: true,
      headers,
    }, (err, res, payload) => {
      if (err) {
        return cb(err);
      }
      if (res.statusCode === 404) {
        return cb(new Error('Invalid slug and/or tag'));
      }
      if (res.statusCode !== 200) {
        return cb({ message: 'Api returned a non 200 status code', statusCode: res.statusCode, payload });
      }
      if (typeof payload.content === 'string') {
        try {
          payload.content = JSON.parse(payload.content);
        } catch (e) {
          return cb(e);
        }
      }
      return cb(null, payload);
    });
  }

  getMany(site, slugs, tag, cb) {
    async.map(slugs, (slug, done) => {
      this.get(site, slug, tag, done);
    }, cb);
  }

  getManyAndMerge(site, slugs, tag, cb) {
    async.map(slugs, (slug, done) => {
      this.get(site, slug, tag, done);
    }, (err, data) => {
      if (err) {
        return cb(err);
      }
      const content = data.map(item => item.content);
      content.unshift({});
      const merged = defaults.apply(null, content);
      cb(null, merged);
    });
  }

}

module.exports = PageData;
