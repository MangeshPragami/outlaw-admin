// Create or update: backend/src/routes/proxy.js

import express from 'express';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// S3 Content Proxy - handles CORS issues with S3 URLs
router.post('/s3-content', protect, async (req, res) => {
  try {
    const { s3Url } = req.body;
    
    if (!s3Url || !s3Url.includes('amazonaws.com')) {
      return res.status(400).json({ error: 'Valid S3 URL is required' });
    }
    
    console.log('Proxying S3 content fetch for:', s3Url);
    
    // Use node-fetch (install it: npm install node-fetch@2)
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(s3Url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Outlaw-Admin-Dashboard/1.0'
      },
      timeout: 30000 // 30 seconds
    });
    
    if (!response.ok) {
      console.error('S3 fetch failed:', response.status, response.statusText);
      
      // Try to get error details from S3
      let errorText = '';
      try {
        errorText = await response.text();
        console.error('S3 error response:', errorText.substring(0, 500));
      } catch (e) {
        // Ignore
      }
      
      return res.status(response.status).json({ 
        error: `S3 access failed: ${response.status} ${response.statusText}`,
        details: errorText.substring(0, 200)
      });
    }
    
    const contentType = response.headers.get('content-type');
    console.log('S3 content-type:', contentType);
    
    // Get response as text first
    const text = await response.text();
    console.log('S3 response length:', text.length);
    console.log('S3 response preview:', text.substring(0, 300));
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(text);
      console.log('Successfully parsed S3 JSON');
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      return res.status(400).json({ 
        error: 'S3 file contains invalid JSON',
        parseError: parseError.message,
        content: text.substring(0, 1000) // First 1000 chars for debugging
      });
    }
    
    // Return the parsed JSON data
    res.json(data);
    
  } catch (error) {
    console.error('S3 proxy server error:', error);
    res.status(500).json({ 
      error: error.message || 'Server error while fetching S3 content',
      type: error.name || 'UnknownError'
    });
  }
});

// Generic content proxy for any URL
router.post('/fetch-content', protect, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log('Proxying content fetch for:', url);
    
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Outlaw-Admin-Dashboard/1.0'
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Failed to fetch: ${response.status} ${response.statusText}` 
      });
    }
    
    const text = await response.text();
    
    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch (parseError) {
      res.status(400).json({ 
        error: 'Response is not valid JSON',
        content: text.substring(0, 500)
      });
    }
    
  } catch (error) {
    console.error('Generic proxy error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch content' 
    });
  }
});

export default router;

// Don't forget to add this to your main server file:
// import proxyRoutes from './routes/proxy.js';
// app.use('/api/proxy', proxyRoutes);