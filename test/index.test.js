

// node core modules

// 3rd party modules
import test from 'ava';
import Promise from 'bluebird';

// internal modules
import { mock, record, persist } from './fixtures/http-mocking';
import serviceFactory from '../lib';

const {
  unmocked,
} = process.env;

const serviceOptions = { defaults: {} };
if (unmocked) {
  Object.assign(serviceOptions.defaults, {
    auth: {
      user: process.env.username,
      pass: process.env.password,
    },
  });
}
const service = serviceFactory(process.env.IBM_CONNECTIONS_BLOGS_URL || 'https://apps.na.collabserv.com/blogs', serviceOptions);

test.before(() => (unmocked ? record() : mock()));
test.after(() => unmocked && persist());

test.cb('loads feed of posts for individual blog', (t) => {
  const query = { handle: process.env.BLOG_HANDLE || 'fb9504c6-7317-467f-b7cb-4109ec9aee6a' };
  const options = { authType: 'basic' };
  service.getBlogPosts(query, options, (error, { totalResults, entries: blogPosts }) => {
    t.ifError(error);
    t.true(totalResults > 0);
    t.true(Array.isArray(blogPosts));
    t.is(blogPosts.length, 10);
    t.end();
  });
});

test.cb('loads post by id for individual blog', (t) => {
  const query = {
    entryId: process.env.BLOG_ENTRY || '8afbe394-0ef9-4223-b2f9-bb7b55834e61',
    handle: process.env.BLOG_HANDLE || 'fb9504c6-7317-467f-b7cb-4109ec9aee6a',
  };

  const options = { authType: 'basic' };
  service.getBlogPost(query, options, (error, blogPost) => {
    t.ifError(error);
    t.truthy(blogPost);
    t.end();
  });
});

test('create blog post in blog with given handle', async (t) => {
  const options = { authType: 'basic' };
  const createBlogPost = Promise.promisify(service.createBlogPost, { context: service });

  const createdPost = await createBlogPost({
    handle: process.env.BLOG_HANDLE || 'fb9504c6-7317-467f-b7cb-4109ec9aee6a',
    post: {
      title: `Test post ${Math.floor(Math.random() * 999999)}`,
      summary: 'Test summary',
      content: 'Test content',
    },
  }, options);

  t.truthy(createdPost, 'blog post edit url should be returned as a result of the create blog post request');
});
