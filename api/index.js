const express = require('express');
const { makeProviders, makeStandardFetcher, targets } = require('@movie-web/providers');

const app = express();

// 1. Setup the library
const providers = makeProviders({
  fetcher: makeStandardFetcher(fetch),
  target: targets.NATIVE, 
});

// 2. The Link Finder Endpoint
app.get('/get-stream', async (req, res) => {
  const { tmdbId, type, title, year, season, episode } = req.query;

  // Basic check to ensure we have info
  if (!tmdbId || !type || !title || !year) {
    return res.status(400).json({ error: "Missing info. Need tmdbId, type, title, and year." });
  }

  // Setup the search data
  const media = {
    type: type, 
    title: title,
    releaseYear: parseInt(year),
    tmdbId: tmdbId,
    imdbId: req.query.imdbId, // Optional but helpful
    season: season ? { number: parseInt(season), tmdbId: "" } : undefined,
    episode: episode ? { number: parseInt(episode), tmdbId: "" } : undefined
  };

  try {
    console.log(`Searching for: ${title}`);
    
    // Run the scraper (this takes a few seconds)
    const output = await providers.runAll({
      media: media,
      sourceOrder: ['flixhq', 'remotestream', 'vidsrc'] 
    });

    if (output) {
      res.json({ 
        success: true, 
        url: output.stream.playlist, // <--- THIS IS YOUR VIDEO LINK
        quality: output.stream.qualities 
      });
    } else {
      res.status(404).json({ success: false, message: "No stream found." });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Start the server
app.listen(3000, () => console.log('Server ready on port 3000.'));

module.exports = app;
