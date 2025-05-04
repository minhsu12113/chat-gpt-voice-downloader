import fs from 'fs';
import path from 'path';

function parseCurlCommand(curlCmd: string) {
  const result: {
    url: string;
    params: { [key: string]: string };
    headers: { [key: string]: string };
    method: string;
  } = {
    url: '',
    params: {},
    headers: {},
    method: 'GET'
  };

  const urlMatch = curlCmd.match(/"([^"]+)"/);
  if (urlMatch) {
    const fullUrl = urlMatch[1].replace(/\^/g, '');
    try {
      const urlObj = new URL(fullUrl);
      result.url = urlObj.origin + urlObj.pathname;

      urlObj.searchParams.forEach((value, key) => {
        result.params[key] = value.replace(/\^/g, '');
      });
    } catch (err) {
      console.error('Somethings went wrong when parse url:', err);
    }
  }

  const headerMatches = curlCmd.match(/-H\s+\^"([^"]+?)\^"/g);
  if (headerMatches) {
    headerMatches.forEach(header => {
      const headerContent = header.match(/-H\s+\^"([^:]+):\s*([^"]+)\^"/);
      if (headerContent) {
        const [, key, value] = headerContent;
        const cleanedValue = value
          .replace(/\^/g, '')
          .replace(/\\"/g, '"')
          .trim();
        result.headers[key.trim()] = cleanedValue;
      }
    });
  }
  return result;
}

export interface DownloadVoiceProps {
  curlCmd: string;
  filePath: string;
  fileName: string;
  progressCallback: (downloadedMB: number, speed: number) => void;
  successCallback: (filePath: string, fileName: string) => void;
  errorCallback: (error: Error) => void;
}

export async function downloadFile({...prop}: DownloadVoiceProps) {
  try {
    const { url, params, headers } = parseCurlCommand(prop.curlCmd);
    if (!url) throw new Error(`Can't parse url from curl command`);

    const urlWithParams = new URL(url);
    Object.entries(params).forEach(([key, value]) => urlWithParams.searchParams.append(key, value));

    const response = await fetch(urlWithParams.toString(), {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }

    const filePath = path.join(prop.filePath, prop.fileName);
    let downloadedBytes = 0;
    const fileStream = fs.createWriteStream(filePath);
    const reader = response?.body?.getReader();
    const startTime = Date.now();
    while (true) {

      if (!reader) throw new Error('Failed to get reader from response body');
      const { done, value } = await reader.read();
      if (done) break;

      downloadedBytes += value.length;
      fileStream.write(value);
      const downloadedMB = downloadedBytes / 1_048_576;
      const elapsedSeconds = (Date.now() - startTime) / 1000 || 1;
      if (prop.progressCallback) prop.progressCallback(downloadedMB, elapsedSeconds);
    }
    fileStream.end(); 
    prop.successCallback(filePath, prop.fileName); 
     
  } catch (error) {
    console.error('Error when make request:', (error as Error).message); 
    prop.errorCallback(error as Error);
  }
}