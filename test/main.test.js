/* eslint max-len:0, no-console: 0, no-unused-vars: 0, strict: 0 */
'use strict';

const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const sinon = require('sinon');

const SiteInfoAPI = require('../');
const server = require('./helpers/test_api_server.js');


lab.experiment('PageDataAPI', () => {
  lab.experiment('#()', () => {
    lab.test('it should return and object upon instatiation', done => {
      const siteInfo = new SiteInfoAPI('http://apiurl.com', 'dev', 'somerandomkey');
      Code.expect(siteInfo).to.be.an.object();

      done();
    });
  });

  lab.experiment('.get', () => {
    lab.before(done => {
      server.listen(3080, done);
    });

    lab.after(done => {
      server.close();
      done();
    });

    lab.test('it should call back and error if the slug is not passed', done => {
      const siteInfo = new SiteInfoAPI('http://apiurl', 'dev', 'somekey');
      const errCb = sinon.spy();

      siteInfo.get(null, errCb);

      Code.expect(errCb.args[0][0]).to.exist();
      Code.expect(errCb.args[0][0]).to.be.a.string();
      done();
    });

    lab.test('it should attempt to get an page from the api', done => {
      const siteInfo = new SiteInfoAPI('http://localhost:3080', 'dev', 'na');
      siteInfo.get('some-page', (err, result) => {
        Code.expect(err).to.be.null();
        Code.expect(result).to.be.an.object();
        done();
      });
    });
  });
});
