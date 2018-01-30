

// node core modules
import fs from 'fs';
import path from 'path';

// 3rd party modules
import test from 'ava';
import _ from 'lodash';

// internal modules
import parseBlogPosts from '../../lib/response-parsers/blog-posts';

const xmlString = fs.readFileSync(path.resolve(__dirname, './fixtures/blog-posts.xml'), { encoding: 'utf8' });

test('parses feed of blog posts to array of post objects', (t) => {
  const { totalResults, entries: blogPosts } = parseBlogPosts(xmlString);

  t.is(totalResults, 75);
  t.true(Array.isArray(blogPosts));
  t.is(blogPosts.length, 30);

  const [post] = blogPosts;
  t.is(post.id, '6281f1fe-3e77-4828-8df2-c85dd99597cc');
  t.is(post.title, 'Änderungen Urlaubsregelung und Arbeitszeitkonto');
  t.is(post.status, '');
  t.is(post.updated, 1500646595000);
  t.is(post.edited, '');
  t.is(post.published, 1500646595000);

  t.is(post.summaryType, 'html');
  t.true(post.summary && _.isString(post.summary));
  t.is(post.contentType, 'html');
  t.true(post.content && _.isString(post.content));

  t.is(post.hit, 71);

  const { links } = post;
  t.true(_.isPlainObject(links));
  ['self', 'replies', 'alternate'].forEach((name) => {
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
