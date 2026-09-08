import assert from "node:assert/strict";
import test from "node:test";
import { parseByteRange } from "../worker/byte-range.mjs";

test("parses bounded, open-ended and suffix byte ranges", () => {
  assert.deepEqual(parseByteRange("bytes=0-9", 100), { start: 0, end: 9 });
  assert.deepEqual(parseByteRange("bytes=10-", 100), { start: 10, end: 99 });
  assert.deepEqual(parseByteRange("bytes=-10", 100), { start: 90, end: 99 });
  assert.deepEqual(parseByteRange("bytes=90-120", 100), {
    start: 90,
    end: 99,
  });
  assert.deepEqual(parseByteRange(" bytes=0-0 ", 100), { start: 0, end: 0 });
});

test("rejects unsatisfiable or unsupported ranges", () => {
  for (const value of [
    "bytes=",
    "bytes=-0",
    "bytes=100-",
    "bytes=80-20",
    "bytes=0-1,4-5",
    "items=0-1",
    "bytes=999999999999999999999-",
  ]) {
    assert.equal(parseByteRange(value, 100), null, value);
  }

  assert.equal(parseByteRange("bytes=0-1", 0), null);
  assert.equal(parseByteRange("bytes=0-1", Number.NaN), null);
});
