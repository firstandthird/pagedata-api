'use strict';

const wreck = require('wreck');
const version = require('./package.json').version;

class PageData {
  constructor(host, key, userAgent) {
    this.options = {
      host,
      key,
      userAgent: userAgent || `pagedata-api/${version}`
    };
  }

  get(endpoint, done) {
    const url = `${this.options.host}${endpoint}`;
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
      if (res.statusCode === 404) {
        return done(new Error('Not found'));
      }
      if (res.statusCode !== 200) {
        return done({ message: 'Api returned a non 200 status code', statusCode: res.statusCode, payload });
      }
      done(null, payload);
    });
  }

  getSites(done) {
    this.get('/api/sites', done);
  }

  getCollectionsBySite(siteId, done) {
    this.get(`/api/collections?site=${siteId}`, done);
  }

  getCollectionsBySiteSlug(siteSlug, done) {
    this.get(`/api/collections?siteSlug=${siteSlug}`, done);
  }

  getCollection(collectionId, done) {
    this.get(`/api/collections/${collectionId}`, done);
  }

  getPages(siteSlug, collection, done) {
    if (typeof collection === 'function') {
      done = collection;
      collection = '';
    }
    this.get(`/api/sites/${siteSlug}/pages?${collection ? `collection=${collection}` : ''}`, done);
  }

  getPagesWithContent(siteSlug, collection, done) {
    if (typeof collection === 'function') {
      done = collection;
      collection = '';
    }
    this.get(`/api/sites/${siteSlug}/pages?includeContent=true&${collection ? `collection=${collection}` : ''}`, done);
  }

  getPage(slug, tag, done) {
    if (typeof tag === 'function') {
      done = tag;
      tag = '';
    }
    this.get(`/api/pages/${slug}?tag=${tag}`, done);
  }
}

module.exports = PageData;
