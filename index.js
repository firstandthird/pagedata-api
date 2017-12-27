const wreck = require('wreck');
const version = require('./package.json').version;
const querystring = require('querystring');
const Boom = require('boom');
const joi = require('joi');

class PageData {
  constructor(options) {
    const validation = joi.validate(options, {
      host: joi.string(),
      key: joi.string(),
      userAgent: joi.string().default(`pagedata-api/${version}`),
      timeout: joi.number().default(0),
      status: joi.string().default('draft')
    });
    if (validation.error) {
      throw validation.error;
    }
    this.options = validation.value;
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

  get(endpoint) {
    return this.request('get', endpoint, null);
  }

  post(endpoint, data) {
    return this.request('post', endpoint, data);
  }

  put(endpoint, data) {
    return this.request('put', endpoint, data);
  }

  getProjects() {
    return this.get('/api/projects');
  }

  getPages(query) {
    if (!query) {
      query = {};
    }
    // add the default page status if not specified:
    if (!query.status) {
      query.status = this.options.status;
    }
    const qs = querystring.stringify(query);
    return this.get(`/api/pages?${qs}`);
  }

  getPage(slug, query) {
    if (!query) {
      query = {};
    }
    // add the default page status if not specified:
    if (!query.status) {
      query.status = this.options.status;
    }
    const qs = querystring.stringify(query);
    return this.get(`/api/pages/${slug}?${qs}`);
  }
}

module.exports = PageData;
