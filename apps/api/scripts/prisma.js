#!/usr/bin/env node --env-file ../.env

const assert = require('node:assert/strict');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const { PrismaClient } = require('../dist/src/generated/prisma/client');

/** @type {PrismaClient} */
global.getPrisma = async function getPrisma() {
  assert.ok(process.env.DATABASE_URL, 'no DATABASE_URL');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
    log: [{ emit: 'event', level: 'query' }, 'info', 'warn', 'error'],
  });

  prisma.$on('query', (e) => {
    console.debug('QUERY', e.query, e.params, e.duration, 'ms');
  });

  return prisma;
};
