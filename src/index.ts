import fetch from 'cross-fetch';
import {detect} from 'detect-browser';
import {URL, pathToFileURL, fileURLToPath} from 'url';
import path from 'path';
import fs from 'fs-extra';

/*export type RelationsSetting = {
  resources: {
    [table: string]: string
  },
  relations: {
    [table: string]: {
      [resource: string]: {
        is_many: boolean,
        resource: string,
        relations: {
          [source: string]: string
        }
      }
    }
  },
  attributes: {
    [table: string]: {
      [attr: string]: string
    }
  },
  keep?: string[],
  delete?: string[]
};*/

export type RelationsSetting = {
  resources: {
    [table: string]: string
  },
  relations: {
    [table_attr: string]: {
      is_many: boolean,
      resource: string,
      relations: {
        [source: string]: string
      }
    }
  },
  attributes: {
    [table_attr: string]: string
  },
  keep?: string[],
  delete?: string[],
  id?: string
};

export default class Hoshu {
  private isNode = false;

  constructor() {
    const browser = detect();
    if (browser && browser.type === 'node') this.isNode = true;
  }

  async fetch(pathStr: string, relDefs?: RelationsSetting): Promise<any> {
    let pathUrl: URL;
    if (this.isNode && !pathStr.match(/^https?:\/\//)) {
      pathUrl = pathToFileURL(pathStr);
    } else {
      pathUrl = new URL(pathStr, !this.isNode ? location.href : undefined);
    }
    const json = await this.fetchUrl(pathUrl);
    const defs = relDefs || json['hoshu:relation'] as RelationsSetting | undefined;
    const tables: any = {
      main: json
    };
    // Preparation for attribute deleting
    const deleteAttrs: any = {
      main: []
    };
    if (defs) {
      const keepArr = defs.keep || [];
      const deleteArr = defs.delete || [];
      const idAttr = defs.id || 'fid';

      // Process 1: Fetch sub tables
      const resources = defs.resources;
      await Promise.all(Object.keys(resources).map(async (key) => {
        const subUrl = new URL(resources[key], pathUrl);
        tables[key] = await this.fetchUrl(subUrl);
        deleteAttrs[key] = [idAttr];
      }));
      deleteArr.forEach((tableAttr: string) => {
        const [tableName, attr] = tableAttr.split('.');
        deleteAttrs[tableName].push(attr);
      });

      // Process 2: Make relationships of tables
      const relations = defs.relations;
      Object.keys(relations).forEach((tableAttr) => {
        const [tableName, attr] = tableAttr.split('.');
        const table = tables[tableName];
        const relSetting = relations[tableAttr];
        const resource = tables[relSetting.resource];
        if (deleteAttrs[tableName].indexOf(attr) === -1 && attr.match(/^_/)) deleteAttrs[tableName].push(attr);
        table.features.forEach((item: any) => {
          item.properties[attr] = resource.features.reduce((prev: any, resItem: any) => {
            if (prev && !relSetting.is_many) return prev;
            else if (relSetting.is_many && !prev) prev = [];
            const flag = Object.keys(relSetting.relations).reduce((prev:boolean, key) => {
              return prev && (item.properties[key] === resItem.properties[relSetting.relations[key]]);
            }, true);
            if (flag) {
              if (!relSetting.is_many) return resItem.properties;
              prev.push(resItem.properties);
            }
            return prev;
          }, undefined);
        });
        // Create deletion list
        Object.keys(relSetting.relations).forEach((key) => {
          const resKey = relSetting.relations[key];
          if (deleteAttrs[tableName].indexOf(key) === -1 &&
            keepArr.indexOf(`${tableName}.${key}`) === -1 && tableName !== 'main') deleteAttrs[tableName].push(key);
          if (deleteAttrs[relSetting.resource].indexOf(resKey) === -1 &&
            keepArr.indexOf(`${relSetting.resource}.${resKey}`) === -1 && relSetting.resource !== 'main') deleteAttrs[relSetting.resource].push(resKey);
        });
      });

      // Process 3: Alias for attributes
      const attributes = defs.attributes;
      Object.keys(attributes).forEach((tableAttr) => {
        const [tableName, attr] = tableAttr.split('.');
        const table = tables[tableName];
        const source = attributes[tableAttr];
        const [resource, resAttr] = source.split('.');
        table.features.forEach((item: any) => {
          item.properties[attr] = item.properties[resource][resAttr];
        });
      });
      console.log(deleteAttrs);

      // Process 4: Delete attributes
      Object.keys(deleteAttrs).forEach((tableName) => {
        const table = tables[tableName];
        const delList = deleteAttrs[tableName];
        if (delList.length > 0) {
          table.features.forEach((item: any) => {
            delList.forEach((delKey: string) => {
              delete item.properties[delKey];
            });
          });
        }
      });
    }

    delete json['hoshu:relation'];
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

