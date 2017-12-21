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

  async request(method, endpoint, data) {
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
    const res = await wreck.request(method, url, reqOpts);

    if (res.statusCode === 404) {
      throw Boom.notFound();
    }
    return wreck.read(res, { json: true });
  }

  async get(endpoint) {
    return this.request('get', endpoint, null);
  }

  async post(endpoint, data) {
    return this.request('post', endpoint, data);
  }

  async put(endpoint, data) {
    return this.request('put', endpoint, data);
  }

  async getProjects() {
    return this.get('/api/projects');
  }

  async getPages(query) {
    if (!query) {
      query = {};
    }
    const qs = querystring.stringify(query);
    return this.get(`/api/pages?${qs}`);
  }

  async getPage(slug, query) {
    if (!query) {
      query = {};
    }
    const qs = querystring.stringify(query);
    return this.get(`/api/pages/${slug}?${qs}`);
  }
}

module.exports = PageData;
