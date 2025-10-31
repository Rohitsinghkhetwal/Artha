import axios from "axios";
import { parseXMLToJSON, extractJobsFromXML } from "../utils/Xmlparser.js";
import {logger} from "../utils/logger.js";

const TIMEOUT = 30000;

//services for fetch jobs from apis 

const fetchJobsFromAPI = async (apiUrl) => {
  try {
    logger.info(`Fetching jobs from: ${apiUrl}`);

    const response = await axios.get(apiUrl, {
      timeout: TIMEOUT,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; JobImporterBot/1.0)",
        Accept: "application/xml, text/xml, */*",
      },
      responseType: "text",
    });

    // logger.info("RESPONSE HERE ", response.data)

    const parsedData = await parseXMLToJSON(response.data);
    // console.log("PARSED DATA ",parsedData)
    const jobs = extractJobsFromXML(parsedData, apiUrl);
    // console.log("JOBS ---", jobs)

    logger.success(`Fetched ${jobs.length} jobs from ${apiUrl}`);
    return jobs;
  } catch (error) {
    logger.error(`Failed to fetch from ${apiUrl}:`, error.message);
    throw error;
  }
};



const fetchFromMultipleAPIs = async (apiUrls) => {
  const results = {};

  for (const apiUrl of apiUrls) {
    try {
      results[apiUrl] = await fetchJobsFromAPI(apiUrl);
    } catch (error) {
      logger.error(`Error fetching from ${apiUrl}:`, error.message);
      results[apiUrl] = [];
    }
    await delay(1000);
  }

  return results;
};

/**
 * Delay helper function
 */
const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export { fetchJobsFromAPI, fetchFromMultipleAPIs, delay };
