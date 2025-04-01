const isValidUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    // Only allow specific protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    // Prevent localhost and private IP access
    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.20.') ||
      hostname.startsWith('172.21.') ||
      hostname.startsWith('172.22.') ||
      hostname.startsWith('172.23.') ||
      hostname.startsWith('172.24.') ||
      hostname.startsWith('172.25.') ||
      hostname.startsWith('172.26.') ||
      hostname.startsWith('172.27.') ||
      hostname.startsWith('172.28.') ||
      hostname.startsWith('172.29.') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

const securityMiddleware = (req, res, next) => {
  // Set security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  });

  // Validate URLs in request parameters
  if (req.query.url && !isValidUrl(req.query.url)) {
    return res.status(400).json({ error: 'Invalid URL provided' });
  }

  // Validate URLs in request body
  if (req.body && typeof req.body === 'object') {
    const hasInvalidUrl = Object.values(req.body).some(value => {
      if (typeof value === 'string' && (value.includes('http://') || value.includes('https://'))) {
        return !isValidUrl(value);
      }
      return false;
    });

    if (hasInvalidUrl) {
      return res.status(400).json({ error: 'Invalid URL in request body' });
    }
  }

  next();
};

module.exports = {
  securityMiddleware,
  isValidUrl
}; 