'use strict';

// node core modules

// 3rd party modules
import test from 'ava';

// internal modules
import serviceFactory from '../lib';

const service = serviceFactory('https://lc.gish.de/blogs/', {
  defaults: {
    auth: {
      user: process.env.username,
      pass: process.env.password,
    },
  },
});

test.cb('foo', (t) => {
  const start = Date.now();
  const query = {};
  const options = { authType: 'basic' };
  service.getBlogPosts('c60f3b80-4284-413e-a6b2-6eafc55f2896', query, options, (error, blogPosts) => {
    const end = Date.now();
    console.log('parsing took %d', end - start);
    t.ifError(error);
    t.truthy(blogPosts);
    t.end();
  });
});
