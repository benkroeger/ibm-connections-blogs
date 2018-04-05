'use strict';

// node core modules
const path = require('path');
const fs = require('fs');

// 3rd party modules
const _ = require('lodash');
const OniyiHttpClient = require('oniyi-http-client');
const credentialsPlugins = require('oniyi-http-plugin-credentials');
const formatUrlTemplatePlugin = require('oniyi-http-plugin-format-url-template');

// internal modules
const responseParsers = require('./response-parsers');

const blogPostTmpl = _.template(fs.readFileSync(path.join(__dirname, 'blog-post.xml.tmpl'), 'utf8'));

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

  const formatUrlTemplateOptions = _.merge(
    {
      valuesMap: {
        authType: {
          basic: '',
          saml: '',
          cookie: '',
        },
      },
    },
    plugins.formatUrlTemplate || {}
  );

  httpClient.use(formatUrlTemplatePlugin(formatUrlTemplateOptions));

  /**
   * [getBlogPosts description]
   * @method getBlogPosts
   * @param  {Object}     query           [description]
   * @param  {String}     query.handle    The Blog handle you want to get entries from.
   *                                      A handle is specified when a blog is first created and is used in the construction of
   *                                      web addresses used to query the entries in a blog.
   *                                      The handle can be the Community Uuid.
   * @param  {Object}     options         Any options you want to pass to `httpClient.makeRequest()`
   *                                      https://github.com/request/request#requestoptions-callback
   * @param  {Function}   [callback]      [description]
   * @return {Promise}                    If no callback is provided, this method returns a Promise
   */
  const getBlogPosts = (query, options, callback) => {
    const qsValidParameters = ['page', 'ps', 'search', 'sortBy', 'sortOrder', 'tags'];

    // construct the request options
    const requestOptions = _.merge(
      {
        // defining defaults in here
        qs: {
          // despite the fact that the documentation for IBM Connections Cloud Blogs (6.0.0) says default value would be "1", it only works with "0"
          // https://www-10.lotus.com/ldd/appdevwiki.nsf/xpAPIViewer.xsp?lookupName=API+Reference#action=openDocument&res_title=Getting_a_feed_of_recent_posts_for_a_blog_ic50&content=apicontent
          page: 0,
          ps: 10, // max is 50
          lang: 'en_us',
        },
      },
      omitDefaultRequestParams(options),
      {
        qs: _.pick(query, qsValidParameters),
        headers: {
          accept: 'application/atom+xml',
        },
        ttl: params.ttl.blogPosts,
        uri: `{ authType }/${query.handle}/feed/entries/atom`,
      }
    );

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

  const getBlogPost = (query, options, callback) => {
    const qsValidParameters = [];

    // construct the request options
    const requestOptions = _.merge(
      {
        // defining defaults in here
        qs: {
          lang: 'en_us',
        },
      },
      omitDefaultRequestParams(options),
      {
        qs: _.pick(query, qsValidParameters),
        headers: {
          accept: 'application/atom+xml',
        },
        ttl: params.ttl.blogPost,
        uri: `{ authType }/${query.handle}/api/entries/${query.entryId}`,
      }
    );

    httpClient.makeRequest(requestOptions, (requestError, response, body) => {
      if (requestError) {
        callback(requestError);
        return;
      }

      const { statusCode, headers: { 'content-type': contentType } } = response;
      // expexted
      // status codes: 200, 401, 404
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

      callback(null, responseParsers.blogPost(body));
    });
  };

  const createBlogPost = ({ handle, post } = {}, options, callback) => {
    // construct the request options
    const requestOptions = _.merge(
      {
        qs: {
          lang: 'en_us',
        },
        method: 'post',
      },
      {
        headers: {
          accept: 'application/atom+xml',
          'Content-Type': 'application/atom+xml',
        },
        uri: `{ authType }/${handle}/api/entries`,
        body: blogPostTmpl(post),
      }
    );

    httpClient.makeRequest(requestOptions, (requestError, response, body) => {
      if (requestError) {
        callback(requestError);
        return;
      }

      const { statusCode, headers: { 'content-type': contentType } } = response;
      if (!response || statusCode !== 201) {
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

      callback(null, responseParsers.blogPost(body));
    });
  };

  return { getBlogPosts, getBlogPost, createBlogPost };
};
