import test from 'node:test';
import assert from 'node:assert/strict';
import { X509Certificate } from 'node:crypto';
import { Client } from 'pg';
import * as repository from '../src/server/repository.js';

test('Supabase: pg conserva la CA y verifica el servidor aunque la URL tenga opciones SSL', () => {
  assert.equal(typeof repository.postgresConnectionOptions, 'function');
  const options = repository.postgresConnectionOptions('postgresql://app.example:example@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require&sslrootcert=missing.crt&ssl=false');
  const client = new Client(options);
  const ssl = client.connectionParameters.ssl;
  assert.equal(ssl.rejectUnauthorized, true);
  const certificate = new X509Certificate(ssl.ca);
  assert.equal(certificate.ca, true);
  assert.match(certificate.subject, /Supabase Root 2021 CA/);
  assert.equal(client.connectionParameters.port, 6543);
  assert.equal(client.connectionParameters.user, 'app.example');
});

test('otras conexiones PostgreSQL conservan sus propias opciones de SSL', () => {
  assert.equal(typeof repository.postgresConnectionOptions, 'function');
  const connectionString = 'postgresql://app:example@database.example.test:5432/event?sslmode=verify-full';
  assert.deepEqual(repository.postgresConnectionOptions(connectionString), {connectionString});
});
