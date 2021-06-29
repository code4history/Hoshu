import fetch from 'cross-fetch';
import {detect} from 'detect-browser';
import {URL, pathToFileURL, fileURLToPath} from 'url';
import path from 'path';
import fs from 'fs-extra';

type FetchLogic = (pathString: string) => Promise<any>;

export default class Hoshu {
  private isNode = false;

  constructor() {
    const browser = detect();
    if (browser && browser.type === 'node') this.isNode = true;
  }

  async fetch(pathStr: string): Promise<any> {
    let pathUrl: URL;
    if (this.isNode && !pathStr.match(/^https?:\/\//)) {
      pathUrl = pathToFileURL(pathStr);
    } else {
      pathUrl = new URL(pathStr, !this.isNode ? location.href : undefined);
    }
    const json = await this.fetchUrl(pathUrl);
    return json;
  }

  async fetchUrl(pathUrl: URL) {
    if (pathUrl.protocol === 'file:') {
      const pathStr = fileURLToPath(pathUrl);
      return new Promise((res, rej) => {
        fs.readJson(pathStr, (err, obj) => {
          if (err) rej(err);
          else res(obj);
        });
      });
    } else {
      const res = await fetch(pathUrl.href);
      return res.json();
    }
  }
}

