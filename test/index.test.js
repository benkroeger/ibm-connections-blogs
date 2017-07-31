'use strict';

// node core modules

// 3rd party modules
import test from 'ava';

// internal modules
import { mock, record, persist } from './fixtures/http-mocking';
import serviceFactory from '../lib';

const { unmocked } = process.env;

const serviceOptions = { defaults: {} };
if (unmocked) {
  Object.assign(serviceOptions.defaults, {
    auth: {
      user: process.env.username,
      pass: process.env.password,
    },
  });
}
const service = serviceFactory('https://lc.gish.de/blogs/', serviceOptions);

test.before(() => (unmocked ? record() : mock()));
test.after(() => unmocked && persist());

test.cb('loads feed of posts for individual blog', (t) => {
  const query = { handle: 'c60f3b80-4284-413e-a6b2-6eafc55f2896' };
  const options = { authType: 'basic' };
  service.getBlogPosts(query, options, (error, blogPosts) => {
    t.ifError(error);
    t.true(Array.isArray(blogPosts));
    t.is(blogPosts.length, 10);
    t.end();
  });
});
