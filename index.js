'use strict';

const wreck = require('wreck');
const async = require('async');
const defaults = require('lodash.defaultsdeep');

class PageData {
  constructor(url, key, tag) {
    this.options = {
      url,
      key,
      tag: tag || ''
    };
  }

  getUrl(slug) {
    return `${this.options.url}/api/page/${slug}?tag=${this.options.tag}`;
  }

  get(slug, cb) {
    const url = this.getUrl(slug);
    wreck.get(url, {
      json: true,
      headers: {
        'x-api-key': this.options.key
      }
    }, (err, res, payload) => {
      if (err) {
        return cb(err);
      }
      if (res.statusCode !== 200) {
        return cb({ message: 'Api returned a non 200 status code', statusCode: res.statusCode, result: res });
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

  getMany(slugs, cb) {
    async.map(slugs, (slug, done) => {
      this.get(slug, done);
    }, cb);
  }

  getManyAndMerge(slugs, cb) {
    async.map(slugs, (slug, done) => {
      this.get(slug, done);
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

  update(slug, content, cb) {
    const url = this.getUrl(slug);
    const headers = {
      'x-api-key': this.options.key
    };

    if (!content.content) {
      return cb({ message: 'Payload must include content attirbute' });
    }

    const payload = JSON.stringify(content);

    wreck.put(url, {
      json: true,
      headers,
      payload
    }, (err, res, responsePayload) => {
      if (err) {
        return cb(err);
      }
      if (res.statusCode !== 200) {
        return cb({ message: 'Api returned a non 200 status code', statusCode: res.statusCode, result: res });
      }

      cb(null, responsePayload);
    });
  }
}

module.exports = PageData;
