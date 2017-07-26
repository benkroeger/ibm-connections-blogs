'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');
const OniyiHttpClient = require('oniyi-http-client');
const credentialsPlugins = require('oniyi-http-plugin-credentials');
const formatUrlTemplatePlugin = require('oniyi-http-plugin-format-url-template');

// internal modules
const responseParsers = require('./response-parsers');

const omitDefaultRequestParams = (params, extraOmmit = []) =>
  _.omit(params, ['uri', 'url', 'method', 'qs', 'baseUrl', ...extraOmmit]);

/**
 * [exports description]
 * @method exports
 * @param  {String} baseUrl     the base url to reach an IBM Connections Blogs application
 *                              e.g. `https://apps.na.collabserv.com/blogs/`
 * @param  {Object} [params={}] [description]
 * @return {[type]}             [description]
 */
module.exports = (baseUrl, params = {}) => {
  _.merge(params, {
    defaults: {
      authType: 'basic',
      baseUrl: (baseUrl.endsWith('/') && baseUrl) || `${baseUrl}/`,
    },
    ttl: {},
  });

  const httpClient = new OniyiHttpClient(params);

  const { plugins = {} } = params;
  if (plugins.credentials) {
    httpClient.use(credentialsPlugins(plugins.credentials));
  }

  const formatUrlTemplateOptions = _.merge({
    valuesMap: {
      authType: {
        basic: '',
        saml: '',
        cookie: '',
      },
    },
  }, plugins.formatUrlTemplate || {});

  httpClient.use(formatUrlTemplatePlugin(formatUrlTemplateOptions));

  const getBlogPosts = (handle, query, options, callback) => {
    const qsValidParameters = ['page', 'ps', 'search', 'sortBy', 'sortOrder', 'tags'];

    // construct the request options
    const requestOptions = _.merge({
      // defining defaults in here
      qs: {
        page: 1,
        ps: 10, // max is 50
      },
    }, omitDefaultRequestParams(options), {
      handle,
      qs: _.pick(query, qsValidParameters),
      headers: {
        accept: 'application/atom+xml',
      },
      ttl: params.ttl.blogPosts,
      uri: '{ authType }/{ handle }/feed/entries/atom',
    });

    httpClient.makeRequest(requestOptions, (requestError, response, body) => {
      if (requestError) {
        callback(requestError);
        return;
      }

      const { statusCode, headers: { 'content-type': contentType } } = response;
      // expexted
      // status codes: 200, 403, 404
      // content-type: application/atom+xml
      if (!response || statusCode !== 200) {
        const error = new Error(body || 'received response with unexpected status code');
        error.httpStatus = statusCode;
        callback(error);
        return;
      }

      if (!response.headers || !contentType.startsWith('application/atom+xml')) {
        const error = new Error(`received response with unexpected content-type ${contentType}`);
        error.httpStatus = 401;
        callback(error);
        return;
      }

      callback(null, responseParsers.blogPosts(body));
    });
  };

  return { getBlogPosts };
};
