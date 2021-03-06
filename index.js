const wreck = require('wreck');
const version = require('./package.json').version;
const querystring = require('querystring');
const Boom = require('boom');
const joi = require('joi');
const pprops = require('p-props');

class PageData {
  constructor(options) {
    const validation = joi.validate(options, {
      host: joi.string(),
      key: joi.string(),
      userAgent: joi.string().default(`pagedata-api/${version}`),
      timeout: joi.number().default(0),
      status: joi.string().default('draft'),
      retryOnGet: joi.number().default(0)
    });
    if (validation.error) {
      throw validation.error;
    }
    this.options = validation.value;
  }

  async request(method, endpoint, data) {
    const url = `${this.options.host}${endpoint}`;
    const headers = {
      'x-api-token': this.options.key
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
    let respPayload;
    try {
      respPayload = wreck.read(res, { json: true });
    } catch (err) {
      err.data = err.data || {};
      err.data.res = res;
      throw err;
    }

    if (res.statusCode >= 400) {
      const errData = {
        isResponseError: true,
        headers: res.headers,
        url,
        payload: respPayload
      };
      throw new Boom(`Response Error: ${res.statusCode} ${res.statusMessage}`, { statusCode: res.statusCode, data: errData });
    }
    return respPayload;
  }

  get(endpoint) {
    const callIt = async(count = 0) => {
      let response;
      try {
        response = await this.request('get', endpoint, null);
      } catch (e) {
        if (count < this.options.retryOnGet) {
          return callIt(count + 1);
        }
        throw e;
      }

      return response;
    };
    return callIt();
  }

  post(endpoint, data) {
    return this.request('post', endpoint, data);
  }

  put(endpoint, data) {
    return this.request('put', endpoint, data);
  }

  getFolders() {
    return this.get('/api/folders');
  }

  getPages(folder, query) {
    if (!query) {
      query = {};
    }
    // add the default page status if not specified:
    if (!query.status) {
      query.status = this.options.status;
    }
    const qs = querystring.stringify(query);
    return this.get(`/api/pages/${folder}?${qs}`);
  }

  async getMultiplePages(pages, query = {}, map = false) {
    // add the default page status if not specified:
    if (!query.status) {
      query.status = this.options.status;
    }
    const qs = querystring.stringify(query);
    const obj = await pprops(pages.reduce((memo, page) => {
      memo[page.slug] = this.get(`/api/pages/${page.folder}/${page.slug}?${qs}`);
      return memo;
    }, {}));
    if (!map) {
      return obj;
    }
    const mapped = {};
    Object.keys(map).forEach(mapKey => {
      mapped[mapKey] = obj[map[mapKey]].content;
    });
    return mapped;
  }

  getPage(folder, slug, query) {
    if (!query) {
      query = {};
    }
    // add the default page status if not specified:
    if (!query.status) {
      query.status = this.options.status;
    }
    const qs = querystring.stringify(query);
    return this.get(`/api/pages/${folder}/${slug}?${qs}`);
  }
}

module.exports = PageData;
