

const http = require('http');

module.exports = http.createServer((req, res) => {
  if (req.url === '/dev/api/page/some-page') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ content: { one: 'uno', two: 'dos' } }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ err: 'No such luck', url: req.url }));
  }
});
