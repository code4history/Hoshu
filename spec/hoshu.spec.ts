/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-var-requires */
import Hoshu from "../src";
import { toBeDeepCloseTo } from "jest-matcher-deep-close-to";
expect.extend({ toBeDeepCloseTo });

describe(`Test by actual data (A)`, () => {
  it(`Compare with actual data (A)`, async done => {
    const hoshu = new Hoshu();

    /*const relSetting = {
      resources: {
        images: "./images.geojson",
        refs: "./refs.geojson",
        books: "./books.geojson"
      },
      relations: {
        main: {
          images: {
            is_many: true,
            resource: "images",
            relations: {
              fid: "poi"
            }
          },
          books: {
            is_many: true,
            resource: "refs",
            relations: {
              fid: "poi"
            }
          }
        },
        refs: {
          _books: {
            is_many: false,
            resource: "books",
            relations: {
              book: "fid"
            }
          }
        }
      },
      attributes: {
        refs: {
          name: "_books.name",
          editor: "_books.editor",
          publishedAt: "_books.publishedAt"
        }
      },
      keep: ["main.fid"],
      delete: ["refs.fid"]
    };*/

    const relSetting = {
      resources: {
        images: "./images.geojson",
        refs: "./refs.geojson",
        books: "./books.geojson"
      },
      relations: {
        "main.images": {
          is_many: true,
          resource: "images",
          relations: {
            fid: "poi"
          }
        },
        "main.books": {
          is_many: true,
          resource: "refs",
          relations: {
            fid: "poi"
          }
        },
        "refs._books": {
          is_many: false,
          resource: "books",
          relations: {
            book: "fid"
          }
        }
      },
      attributes: {
        "refs.name": "_books.name",
        "refs.editor": "_books.editor",
        "refs.publishedAt": "_books.publishedAt"
      },
      keep: [],
      delete: []
    };

    const json1 = await hoshu.fetch('https://code4history.dev/TatebayashiStones/pois.geojson', relSetting);
    console.log(JSON.stringify(json1.features[0]));
    const json2 = await hoshu.fetch('../TatebayashiStones/pois.geojson', relSetting);
    console.log(json2);
    const json3 = await hoshu.fetch('https://example.com/hoge.json', relSetting);
    console.log(json3);

    //const hoshu = new Hoshu();
    //const content = await hoshu.fetch('../.gitignore');
    //console.log(content);
    expect(json1).toEqual('Hoge');
    done();
  });
});