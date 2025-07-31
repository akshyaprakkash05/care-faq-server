const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());

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
      result.push(`⚠️ Error fetching from ${source.name}`);
    }
  }

  return result.join('\n');
}

app.get('/sse', async (req, res) => {
  const question = req.query.q || 'No question';
  const answer = await fetchFAQs(question);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write(`data: ${JSON.stringify({ answer })}\n\n`);
});

app.listen(PORT, () => {
  console.log(`🚀 Server is live at http://localhost:${PORT}/sse`);
});
