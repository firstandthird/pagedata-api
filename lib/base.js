'use strict';

const wreck = require('wreck');

class PageData {
  constructor(url, env, key) {
   this.options = {
    url: url,
    env: env,
    key: key
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
      if(err) {
        return cb(err);
      }
      if(res.statusCode !== 200) {
        return cb({message: 'Api returned a non 200 status code', statusCode: res.statusCode, result: res});
      }
      return cb(null, payload.content);
    });
  }

  getMany(slugs, cb) {
    const self = this;
    async.map(slugs, (slug, done) => {
      self.get(slug, done);
    }, cb); 
  }

  update(slug, content, cb) {
    const url = this.getUrl(slug);
    const headers = {
      'x-api-key': this.options.key,
      'Content-type': 'application/json'
    };

    if(!content.content) {
      return cb({message: 'Payload must includ content attirbute'});
    }

    const payload = JSON.stringify(content);

    wreck.put(url, {headers: headers, payload: payload}, (err, res, payload) => {
      if(err) {
        return cb(err);
      }
      if(res.statusCode !== 200) {
        return cb({message: 'Api returned a non 200 status code', statusCode: res.statusCode, result: res});
      }

      try {
        const payload = JSON.parse(payload.toString());
      } catch(e) {
        return cb({message: 'Invalid json returned from API', payload: payload.toString()});
      }

      cb(null, payload);
    });
  }

}

module.exports = PageData;
