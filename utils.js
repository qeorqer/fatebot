import fetch from 'node-fetch';

export const fetcher = async (url, options = {}) => {
  const response = await fetch(url, options);
  const data = await response.json();

  return data;
}
