/**
 * Resolves local file paths or S3 absolute URLs to valid links.
 * Extracts backend host dynamically from REACT_APP_API_URL or defaults to localhost.
 */
export const getFileUrl = (path) => {
  if (!path) return '';
  // If it's an S3 URL or external URL, return it as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Get API URL from environment
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
  
  // Strip trailing slash if present, then strip '/api'
  const baseHost = apiUrl.replace(/\/+$/, '').replace(/\/api$/, '');
  
  // Ensure path starts with a slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseHost}${cleanPath}`;
};
