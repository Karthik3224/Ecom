import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validRegistrationName, validRegistrationGmail } from './registrationValidation.js';
import { formatIndianMobile } from './phoneValidation.js';

test('full name requires three letters, not digits or padding', () => {
  for (const name of ['', ' A ', 'Ab', 'A B', '123', 'Joe123']) assert.equal(validRegistrationName(name), false);
  for (const name of ['Ana', 'John Doe', "Ann-Marie", "O'Neil"]) assert.equal(validRegistrationName(name), true);
});
test('registration accepts Gmail syntax only', () => {
  for (const email of ['user@gmail.com', ' First.Last@GMAIL.com ']) assert.equal(validRegistrationGmail(email), true);
  for (const email of ['user@example.com', 'user@gmail.com.evil', 'a..b@gmail.com', '.a@gmail.com', 'a b@gmail.com']) assert.equal(validRegistrationGmail(email), false);
});
test('Indian mobile requires ten digits starting 6-9', () => {
  assert.equal(formatIndianMobile('9876543210'), '+91 9876543210');
  for (const mobile of ['1234567890', '98765', '+449876543210']) assert.equal(formatIndianMobile(mobile), '');
});
