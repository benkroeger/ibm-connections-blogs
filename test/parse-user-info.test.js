'use strict';

// node core modules
import fs from 'fs';
import path from 'path';

// 3rd party modules
import test from 'ava';
import { ensureXMLDoc } from 'oniyi-utils-xml';

// internal modules
import parseBlogPosts from '../lib/response-parsers/blog-posts';

const xmlString = fs.readFileSync(path.resolve(__dirname, './fixtures/blog-posts.xml'), { encoding: 'utf8' });

test('foo', (t) => {
  const start = Date.now();
  const blogPosts = parseBlogPosts(xmlString);
  const end = Date.now();
  console.log('parsing took %d', end - start);
  t.truthy(blogPosts);
});
