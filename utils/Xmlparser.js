import xml2js from 'xml2js'



const parser = new xml2js.Parser({
  explicitArray: false,
  mergeAttrs: true,
  trim: true,
  normalize: true,
  normalizeTags: false,
  explicitRoot: false,
});

/**
 * Parse XML string to JSON object
 */
const parseXMLToJSON = async (xmlString) => {
  try {
    const result = await parser.parseStringPromise(xmlString);
    return result;
  } catch (error) {
    console.error(' XML Parsing Error:', error.message);
    throw new Error(`Failed to parse XML: ${error.message}`);
  }
};

/**
 * Extract jobs from parsed XML data
 */
const extractJobsFromXML = (parsedData, sourceUrl) => {
  let items = [];

  if (parsedData.rss?.channel?.item) {
    items = Array.isArray(parsedData.rss.channel.item)
      ? parsedData.rss.channel.item
      : [parsedData.rss.channel.item];
  } else if (parsedData.feed?.entry) {
    items = Array.isArray(parsedData.feed.entry)
      ? parsedData.feed.entry
      : [parsedData.feed.entry];
  } else if (parsedData.channel?.item) {
    items = Array.isArray(parsedData.channel.item)
      ? parsedData.channel.item
      : [parsedData.channel.item];
  }

  return items.map((item, index) => normalizeJobData(item, sourceUrl, index));
};

//Normalize job data 
const normalizeJobData = (item, sourceUrl, index) => {
  const externalId = 
    item.guid?._ || 
    item.guid || 
    item.id || 
    `${generateHash(sourceUrl)}-${index}`;

  return {
    externalId: String(externalId).replace(/[^a-zA-Z0-9-_]/g, '-').substring(0, 100),
    title: cleanText(item.title || 'Untitled Position'),
    company: cleanText(
      item.company || 
      item['dc:creator'] || 
      item.author?.name || 
      item.author || 
      'Unknown Company'
    ),
    location: cleanText(
      item.location || 
      item['job:location'] || 
      item.region || 
      'Remote'
    ),
    description: cleanHTML(
      item.description || 
      item['content:encoded'] || 
      item.summary || 
      item.content?._ || 
      item.content || 
      ''
    ),
    jobType: extractJobType(item),
    category: cleanText(
      item.category || 
      item['job:category'] || 
      item['job_category'] || 
      ''
    ),
    url: extractURL(item),
    sourceUrl: sourceUrl,
    salary: cleanText(item.salary || item['job:salary'] || ''),
    postedDate: parseDate(
      item.pubDate || 
      item.published || 
      item.date || 
      item.updated
    ),
  };
};

// Job type extraction
const extractJobType = (item) => {
  const typeStr = String(
    item.jobType || 
    item['job:type'] || 
    item.type || 
    item['job_type'] || 
    ''
  ).toLowerCase();

  if (typeStr.includes('full')) return 'full-time';
  if (typeStr.includes('part')) return 'part-time';
  if (typeStr.includes('contract')) return 'contract';
  if (typeStr.includes('freelance')) return 'freelance';
  if (typeStr.includes('intern')) return 'internship';
  return 'full-time';
};

// Url extraction form the xml 
const extractURL = (item) => {
  return (
    item.link?.href || 
    item.link || 
    item.url || 
    item.guid?._ || 
    item.guid || 
    ''
  );
};

// Clean text content
 
const cleanText = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);
};

// Clean HTML content

const cleanHTML = (html) => {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 5000);
};

//Parse date string
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date() : date;
  } catch {
    return new Date();
  }
};

//Generate hash from string
const generateHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

export {
  parseXMLToJSON,
  extractJobsFromXML,
  normalizeJobData,
  extractJobType,
  extractURL,
  cleanText,
  cleanHTML,
  parseDate,
  generateHash,
};