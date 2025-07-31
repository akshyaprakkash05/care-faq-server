const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // allow all
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const sources = [
  {
    name: 'Chosen Care Group',
    url: 'https://chosencaregroup.com/',
  },
  {
    name: 'CQC',
    url: 'https://www.cqc.org.uk/',
  },
];

async function fetchFAQs(query) {
  let result = [];

  for (const source of sources) {
    try {
      const { data } = await axios.get(source.url);
      const $ = cheerio.load(data);
      const text = $('body').text();

      if (text.toLowerCase().includes(query.toLowerCase())) {
        result.push(`✅ Answer found at ${source.name} (${source.url})`);
      } else {
        result.push(`❌ No match found at ${source.name}`);
      }
    } catch (err) {
      result.push(`⚠️ Error accessing ${source.name}`);
    }
  }

  return result.join('\n');
}

app.get('/sse', async (req, res) => {
  const question = req.query.q || 'No question';
  const answer = await fetchFAQs(question);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  res.write(`data: ${JSON.stringify({ answer })}\n\n`);

  // Keep connection open a bit longer for ChatGPT
  setTimeout(() => {
    res.end();
  }, 3000);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}/sse`);
});
