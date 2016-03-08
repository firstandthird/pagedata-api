'use strict';

const wreck = require('wreck');
const async = require('async');

class PageData {
  constructor(url, env, key) {
    this.options = {
      url,
      env,
      key
    };
    return this;
  }

  getUrl(slug) {
    return `${this.options.url}/${this.options.env}/api/page/${slug}`;
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
        return cb({
          message: 'Api returned a non 200 status code',
          statusCode: res.statusCode,
          result: res
        });
      }
      return cb(null, payload);
    });
  }

  getMany(slugs, cb) {
    async.map(slugs, (slug, done) => {
      this.get(slug, done);
    }, cb);
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
        return cb({
          message: 'Api returned a non 200 status code',
          statusCode: res.statusCode,
          result: res
        });
      }

      cb(null, responsePayload);
    });
  }
}

module.exports = PageData;
