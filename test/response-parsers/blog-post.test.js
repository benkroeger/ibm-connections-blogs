

// node core modules
import fs from 'fs';
import path from 'path';

// 3rd party modules
import test from 'ava';
import _ from 'lodash';

// internal modules
import parseBlogPosts from '../../lib/response-parsers/blog-post';

const xmlString = fs.readFileSync(path.resolve(__dirname, './fixtures/blog-post.xml'), { encoding: 'utf8' });

test('parses blog post to post objects', (t) => {
  const post = parseBlogPosts(xmlString);

  t.is(post.id, '4a8d6ca2-fc47-433b-8061-989e14745b19');
  t.is(post.title, 'Herzlich Willkommen!');
  t.is(post.status, 'approved');
  t.is(post.updated, 1501568843000);
  t.is(post.edited, 1501568843000);
  t.is(post.published, 1501568843000);
  t.is(post.communityUuid, 'c60f3b80-4284-413e-a6b2-6eafc55f2896');

  t.is(post.summaryType, 'html');
  t.true(post.summary && _.isString(post.summary));
  t.is(post.contentType, 'html');
  t.true(post.content && _.isString(post.content));

  t.is(post.hit, 15);

  const { links } = post;
  t.true(_.isPlainObject(links));
  ['replies', 'alternate'].forEach((name) => {
    /* beautify preserve:start */
    const { [name]: link } = links;
    /* beautify preserve:end */
    t.true(link.type && _.isString(link.type));
    t.true(link.href && _.isString(link.href));
  });

  const { recommendations } = post;
  t.true(_.isPlainObject(recommendations));
  t.true(_.isString(recommendations.title));
  t.true(_.isString(recommendations.href));
  t.true(_.isNumber(recommendations.count));

  const { author } = post;

  t.true(_.isPlainObject(author));
  t.true(_.isString(author.name));
  t.true(_.isString(author.userId));
  t.true(_.isString(author.state));
  t.true(_.isBoolean(author.external));
});
