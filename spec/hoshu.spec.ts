/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-var-requires */
import Hoshu from "../src";
import { toBeDeepCloseTo } from "jest-matcher-deep-close-to";
expect.extend({ toBeDeepCloseTo });

describe(`Test by actual data (A)`, () => {
  it(`Compare with actual data (A)`, async done => {
    const hoshu = new Hoshu();

    const json1 = await hoshu.fetch('https://code4history.dev/TatebayashiStones/tatebayashi_stones.geojson');
    console.log(json1);
    const json2 = await hoshu.fetch('../TatebayashiStones/tatebayashi_stones.geojson');
    console.log(json2);
    const json3 = await hoshu.fetch('https://example.com/hoge.json');
    console.log(json3);

    //const hoshu = new Hoshu();
    //const content = await hoshu.fetch('../.gitignore');
    //console.log(content);
    expect(json1).toEqual('Hoge');
    done();
  });
});