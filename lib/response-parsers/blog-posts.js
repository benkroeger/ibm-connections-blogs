'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');
const { ensureXMLDoc } = require('oniyi-utils-xml');

// internal modules
const xpathSelect = require('../xpath-select');

const linkSelectors = {
  edit: 'atom:link[@rel="edit" and @type="application/atom+xml"]', // only available if authenticated user is blog author
  self: 'atom:link[@rel="self" and @type="application/atom+xml"]',
  replies: 'atom:link[@rel="replies" and @type="application/atom+xml"]',
  media: 'atom:link[@rel="media" and @type="application/atom+xml"]', // [bk] @NOTE not always available, not sure what conditions have to be met here
  alternate: 'atom:link[@rel="alternate" and @type="text/html"]', // this takes you to the recent updated view
};

const toDate = val => val && Date.parse(val);

const urnRegexp = /([a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12})$/;

const urnToId = (val) => {
  const [, id] = val.match(urnRegexp);
  return id;
};

const parseUserInfo = node => node && {
  name: xpathSelect('string(atom:name/text())', node, true),
  userId: xpathSelect('string(snx:userid/text())', node, true),
  state: xpathSelect('string(snx:userState/text())', node, true),
  external: xpathSelect('boolean(snx:isExternal/text())', node, true),
};

const parseRecommendations = (entry, collection) => entry && collection && {
  title: xpathSelect('string(atom:title/text())', collection, true),
  href: xpathSelect('string(@href)', collection, true),
  count: xpathSelect('number(snx:rank[@scheme="http://www.ibm.com/xmlns/prod/sn/recommendations"]/text())', entry, true),
};

const parseComments = (entry, collection) => entry && collection && {
  title: xpathSelect('string(atom:title/text())', collection, true),
  href: xpathSelect('string(@href)', collection, true),
  count: xpathSelect('number(snx:rank[@scheme="http://www.ibm.com/xmlns/prod/sn/comment"]/text())', entry, true),
};

module.exports = (stringOrXMLDoc) => {
  const xmlDoc = ensureXMLDoc(stringOrXMLDoc);

  return _.map(xpathSelect('/atom:feed/atom:entry', xmlDoc), (entryNode) => {
    const post = {
      id: urnToId(xpathSelect('string(atom:id/text())', entryNode, true)),
      urn: xpathSelect('string(atom:id/text())', entryNode, true),
      communityUuid: xpathSelect('string(snx:communityUuid/text())', entryNode, true),
      title: xpathSelect('string(atom:title/text())', entryNode, true),
      // status: xpathSelect('snx:moderation/@status', entryNode, true).value,
      updated: toDate(xpathSelect('string(atom:updated/text())', entryNode, true)),
      edited: toDate(xpathSelect('string(app:edited/text())', entryNode, true)),
      published: toDate(xpathSelect('string(atom:published/text())', entryNode, true)),
      summaryType: xpathSelect('string(atom:summary/@type)', entryNode, true),
      summary: xpathSelect('string(atom:summary/text())', entryNode, true),
      contentType: xpathSelect('string(atom:content/@type)', entryNode, true),
      content: xpathSelect('string(atom:content/text())', entryNode, true),
      hit: xpathSelect('number(snx:rank[@scheme="http://www.ibm.com/xmlns/prod/sn/hit"]/text())', entryNode, true),
    };

    const recommendations = parseRecommendations(
      entryNode,
      xpathSelect(
        'app:collection[atom:category[@term="recommend" and @scheme="http://www.ibm.com/xmlns/prod/sn/collection"]]',
        entryNode, true
      )
    );

    const comments = parseComments(
      entryNode,
      xpathSelect(
        'app:collection[atom:category[@term="comments" and @scheme="http://www.ibm.com/xmlns/prod/sn/collection"]]',
        entryNode, true
      )
    );

    // parse link nodes
    // link nodes are transformed into an object literal with properties "href" and "type"
    const links = _.reduce(linkSelectors, (result, selector, key) => {
      const linkNode = xpathSelect(selector, entryNode, true);
      if (linkNode) {
        Object.assign(result, {
          [key]: {
            href: linkNode.getAttribute('href'),
            type: linkNode.getAttribute('type'),
          },
        });
      }
      return result;
    }, {});

    const author = parseUserInfo(xpathSelect('atom:author', entryNode, true));
    const contributor = parseUserInfo(xpathSelect('atom:contributor', entryNode, true));

    /*

      <app:control xmlns:app="http://www.w3.org/2007/app">
          <app:draft>no</app:draft>
          <snx:comments enabled="yes" days="0" xmlns:snx="http://www.ibm.com/xmlns/prod/sn"></snx:comments>
      </app:control>

     */

    return Object.assign(post, { recommendations, comments, links, author, contributor });
  });
};
