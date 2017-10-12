'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');
const { ensureXMLDoc } = require('oniyi-utils-xml');

// internal modules
const xpathSelect = require('../xpath-select');
const blogPostParser = require('./blog-post');

module.exports = (stringOrXMLDoc) => {
  const xmlDoc = ensureXMLDoc(stringOrXMLDoc);

  return _.map(xpathSelect('/atom:feed/atom:entry', xmlDoc), entryNode => blogPostParser(entryNode, true));
};
