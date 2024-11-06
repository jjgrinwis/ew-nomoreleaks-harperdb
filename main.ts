/*
(c) Copyright 2024 Akamai Technologies, Inc. Licensed under Apache 2 license.
Purpose: lookup if a key exits in harperDB
Response should either be:
  {"id": "86cdca52-a34e-4899-8c12-fd370b9b5c56"}
  {"id": "null"}

A null wil always be the answer if anything goes wrong.
*/

import { httpRequest } from "http-request";
import { logger } from "log";

const NOT_FOUND_BODY = { id: null }; // if anything goes wrong, just respond with a null id
const X_HASH_KEY = "X-Hash-Value";
const KEY_PATH = "/knownKey"; // our HarperDB endpoint path, case sensitive!
const HEADERS = { "content-type": "application/json" }; // used in our respondWith()

// let's describe our request info object with dynamic keys for our X_HASH_KEY const
interface RequestInfo {
  knownKeyUrl: string;
  Authorization: string;
  [key: string]: string;
}

export async function onClientRequest(request: EW.IngressClientRequest) {
  /*
    This EdgeWorker is going to call an endpoint and checks if hash exist/
    HTTP call should look like this:

    https://<hostname>/knownKey/
    --header 'X-Hash-Hash: <key>
    --header 'Authorization: Basic <basic auth>'

    The hostname and Authorization part are pretty static, so using PMUSER vars for that.
    The key is coming in via request header and they should all be defined.

    response should be a 200 if found with following payload
    {"id": "86cdca52-a34e-4899-8c12-fd370b9b5c56"}

    or just a non 200 response if not found or an error.
  */

  // Creating an object so we can easily pass it around.
  // for test we can use PMUSER vars, for security auth header should come from master ew calling this subworker
  // If getHeader returns null, ?. prevents accessing [0] on null and directly returns undefined.
  // [VAR] used var dynamic vars
  const requestInfo = {
    knownKeyUrl: request.getVariable("PMUSER_KNOWN_KEY_URL") ?? KEY_PATH,
    Authorization:
      request.getVariable("PMUSER_AUTH_HEADER") ??
      request.getHeader("Authorization")?.[0],
    [X_HASH_KEY]: request.getHeader(X_HASH_KEY)?.[0],
  };

  //logger.log(`reqHeader: ${JSON.stringify(requestInfo)}`);

  // only start http request if all vars have been defined, also fetch the missing key for logging
  const undefinedKeys = Object.entries(requestInfo)
    .filter(([key, value]) => value === undefined)
    .map(([key]) => key);

  if (undefinedKeys.length > 0) {
    logger.error(`Missing key(s): ${undefinedKeys}`);

    // let's get out of here, but let's pretend hash doesn't exists so we don't break to process
    // a respondWith() doesn't stop the EW, have to use return but just using else.
    request.respondWith(200, HEADERS, JSON.stringify(NOT_FOUND_BODY));
  } else {
    // if we have all the required var's fire off our request
    const body = await knownKey(requestInfo);
    request.respondWith(200, HEADERS, JSON.stringify(body));
  }
}

// our function to do the backend call it will return a true or false
async function knownKey(requestInfo: RequestInfo): Promise<object> {
  // creating a new object with only two of our field and assign them to headers object
  const { Authorization } = requestInfo; // Destructure the keys we want
  const dynamicValue = requestInfo[X_HASH_KEY]; // Access the dynamic key using the value of X_HASH_KEY
  const headers = { [X_HASH_KEY]: dynamicValue, Authorization };

  /*
   now fire off our request to knownKeyUrl endpoint, be aware of the limitations:
   like url should be behind Akamai, I repeat, url should be behind Akamai!
   more restrictions can be found here:
   https://techdocs.akamai.com/edgeworkers/docs/http-request#httprequest
  */

  // need to test with timeout....
  // if there is no https://, it will use requesting host, so self which is fine.
  try {
    const result = await httpRequest(requestInfo.knownKeyUrl, {
      headers: headers,
    });

    // just await the result, good or bad
    const response = await result.json();

    // only when we have a 2XX return the received result, otherwise always a not found object.
    // the event will be logged. Use DataStream to get all the logging
    if (result.ok) {
      logger.info(`Request to ${requestInfo.knownKeyUrl} found a match`);
      return response;
    } else if (result.status === 404) {
      // if 404, a key not found
      logger.info(`Request to ${requestInfo.knownKeyUrl} found NO match`);
    } else {
      // anything else, just log an error.
      logger.error(
        `Request to ${requestInfo.knownKeyUrl} failed with status: ${result.status}`
      );
    }
  } catch (error) {
    logger.error(
      `There was a problem calling url ${requestInfo.knownKeyUrl} : ${error}`
    );
  }

  // if anything goes wrong, just respond with a not found.
  return NOT_FOUND_BODY;
}
