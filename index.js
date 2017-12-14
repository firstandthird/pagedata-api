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

  async request(method, endpoint, data) {
    const url = `${this.options.host}${endpoint}`;
    const headers = {
      'x-api-key': this.options.key
    };
    if (this.options.userAgent) {
      headers['user-agent'] = this.options.userAgent;
    }
    try {
      const res = await wreck.request(method, url, {
        payload: data ? JSON.stringify(data) : undefined,
        headers,
      });
      if (res.statusCode === 404) {
        return Boom.notFound();
      }
      return await wreck.read(res, { json: true });
    } catch (e) {
      throw e;
    }
  }

  async get(endpoint) {
    return await this.request('get', endpoint, null);
  }

  async post(endpoint, data) {
    return await this.request('post', endpoint, data);
  }

  async put(endpoint, data) {
    return await this.request('put', endpoint, data);
  }

  async getProjects() {
    return await this.get('/api/projects');
  }

  async getPages(query) {
    if (!query) {
      query = {};
    }
    const qs = querystring.stringify(query);
    return await this.get(`/api/pages?${qs}`);
  }

  async getPage(slug, query) {
    if (!query) {
      query = {};
    }
    const qs = querystring.stringify(query);
    return await this.get(`/api/pages/${slug}?${qs}`);
  }
}

module.exports = PageData;
