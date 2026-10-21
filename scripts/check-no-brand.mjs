#!/usr/bin/env node
/**
 * Fail if a tracked text file contains a guarded substring.
 * Needles are sha256 digests so those substrings are not stored in this repo.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

/** @type {Array<[number, string]>} UTF-8 byte length, sha256 hex */
const needles = [
  [6, "0789d51f29198820de83b435223044428ce68bc1ab8ce2c71aca636009bdaab4"],
  [6, "11039421be8c839915411c9d30dcf3e0d17d5ecb3370ebe2ed66fe2e0b2f11f7"],
  [6, "1285cb759ecf63b74ea3e90de1615e0106954411251cb68009fc9738ec68457b"],
  [6, "1827cd9d198a10f2cdb9ecc32fe21e702d889d4b1f764d7e98e7a6d0bf559c93"],
  [6, "266c9b8cce9f59629530286ee1c09862fcfaef7fdc3c53511b357b80dc0990fc"],
  [6, "3926cdd9707351e7e9402b9ef84689aaa112d9e2382e6e845ac19ab1504756a2"],
  [6, "4cc646b0c25d4623e0632095c340128e91e92a57bc2d60286e4b4192c4d8cf7d"],
  [6, "52e888287e246f9739f5d6c186cdca48c40c2eecbf1d78066259eecad35101d3"],
  [6, "614f0f4c58142e05d6b2adda47de191462f58125d902da5732e722cf1d416952"],
  [6, "85dc21cd8217d1d726b7236840f79aa1a7ffd82eff823972ee0d4604558624f5"],
  [6, "912c88b66e1186aace2ee2641cbf0b7edacdf508f3bbd7aa382da1c003ed8c50"],
  [6, "aeb5287086fdc89363d4289f4dff509976ac06a8ce16d7702fa2f02608e0c531"],
  [6, "b315780a027930e1f26dbb6f159d8f1abc3c78ef326e16c2bd4330c6b2781e89"],
  [6, "d3fa9b2b64f7ff6a0bebdade1d6ea27d585c7496cee67e862990100118b2d586"],
  [6, "f2429a37a0d0478c259a6b792625a638c6cf048b33195d48f94c38113a0a1b49"],
  [6, "f5806dec40bf4defc5b68e1fbbd32f89275790578b80c4390c5a3d0dc3562bf4"],
  [8, "5f0bf2761889c4711e5cf2dd3f9eda17b9fb75744e12aeea6631980f8ae5ef09"],
  [8, "928f821e4dd9803607309544cc6204fd73a97950582c199588b6198bb85f38ea"],
  [9, "01c0ab492c2fa5c402a5fd7898ee21816bc5db588677d68a4cf15d0c516b351a"],
  [9, "27e272289e18a6b662f817d2eaa0143ddfd18ed070137071e6bec242b7028629"],
  [9, "40ca979f6575e0b333558402a72e8abeeaed08703a67a6c6574d6b574063b8c7"],
  [9, "61729bd719f85164ea827134e37c12ae4b1b8c3b5435f085f8ef2920aa5b7e1b"],
  [9, "9ed83dab0513426cd857152b1facdf8cd205b587e5a3dc3986d6ed3910c155a3"],
  [9, "bfe9fe3c45de83ee19b066028646f8d6868ba0fbd7af7e0c6073b9b5aad9f874"],
  [9, "d0243d5d281992f9dbf136980159585a53cfbc61731739fc7bf2f2808e1a3ef9"],
  [9, "f573d0bee30ecf0ea87a7a954c0336312a4f9c0a8f2aa6e1362f33bbe0d14687"],
  [10, "2849ebd96db1170db98702742f08dabd0d394fec22fd1149d73043c80b781f6d"],
  [10, "5db92f9a3b2f93d35c9f9d5c1d261468bfcc75b64fd8d1abd82d37750f82914b"],
  [10, "80553d28f2eb9adf7ff13834bf46113a5c111a1359a75752ca05021d4d333389"],
  [10, "8d31875b365662e538c5e37efad32ab440e308643bdc5810ffcbf70725ac4ddb"],
  [10, "a063861aca8e377ead6a7900abebfee9dec938813d12f8b1d41cd59861660596"],
  [11, "1bc809e329b3a4b0b9270bbd01d9f140cfcdfedfb29247d0e1f4ee1a04969893"],
  [11, "b3d9cea12018e7f22beeda2120d8035a79bc94c52862ab741024993ab37c6819"],
  [11, "d2aa6bf7a41c92d010616388f80fa1b7e5520aee22acfa6e6af9e5f95cd0fe02"],
  [11, "f3c24c7c2ab2c84e9398f3453ffcc0b937673db884b305c19de73845f88e253b"],
  [12, "7cf35355b9dbc50a772e2a12197c44fcb4972606c54aee34228476367e089652"],
  [12, "ccb243c2060495ceff442b26478084421df843ad809cf95281efa11ec309873d"],
  [12, "f9668648e5c7e065ac2ea64ad79ca57b9259b6258817d113485db84102335b9f"],
  [13, "30aba8ce364b40db26e060b6e367263a5061021e37f3719e1873b08df8baa3d1"],
  [14, "45343b14bb986b23afa7b3e70d768195c3ab9055162ddb1f221e369906b103a0"],
  [17, "64737bc53fe817726228035c37e896f863725ab09ae26d2077acfd1bc6475be0"],
  [22, "eff3cca8634308eb31fae3d311cdbb9fc2c8ea36e7cdcf5d8fbe87d8301258b2"],
  [24, "cf1df2be54d3734f0e8f04e016279e260dd89f6a138cc37d0671428c3fb3d53e"],
  [24, "d1c0bf84614dd062bcb70afe413b9f79274ae375d3cc307d8c121755c0f29514"],
  [31, "b1a62440d544665798f5c1c2303d3688b357fb3929d84f65e339d005ff48d310"],
  [35, "43105de640ee1c049e6891c7ee69b0f11ec5a4b0c4f99d89ae0682160984846c"],
  [41, "bf54541f98212cf62e76ceadaf0448d2602c3acaa3e44626fffa94d9e104db2b"],
  [42, "739ce38293930dc8c76cf3d193523503c022b5aa68c0cf8fed5cda8e5d31e0ad"],
];

const byLen = new Map();
for (const [len, hash] of needles) {
  let set = byLen.get(len);
  if (!set) {
    set = new Set();
    byLen.set(len, set);
  }
  set.add(hash);
}

/**
 * @param {Buffer} buf
 */
export function bufferHasNeedle(buf) {
  for (const [len, set] of byLen) {
    if (buf.length < len) continue;
    const last = buf.length - len;
    for (let i = 0; i <= last; i++) {
      const hash = createHash("sha256").update(buf.subarray(i, i + len)).digest("hex");
      if (set.has(hash)) return true;
    }
  }
  return false;
}

const skipDirs = new Set([".git", "node_modules"]);

function walk(dir, hits) {
  for (const name of readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      walk(p, hits);
      continue;
    }
    if (!/\.(md|json|mjs|js|ts|txt|yml|yaml)$/i.test(name) && name !== "LICENSE") continue;
    const buf = readFileSync(p);
    if (buf.includes(0)) continue;
    if (bufferHasNeedle(buf)) hits.push(relative(root, p));
  }
}

function main() {
  const hits = [];
  walk(root, hits);
  if (hits.length) {
    console.error("private-info guard failed:\n" + hits.map((h) => `  - ${h}`).join("\n"));
    process.exit(1);
  }
  console.log("check-no-brand: ok");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
