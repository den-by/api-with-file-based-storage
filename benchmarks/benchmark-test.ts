import Benchmark from 'benchmark';
import { faker } from '@faker-js/faker';

import { DataBaseRepository } from '../src/data-base.repository';

const CACHE_DIR = '../.cache';

function getRandomFileName() {
  return faker.system.fileName();
}

function getRandomText() {
  return faker.lorem.slug(1000);
}

const options = { async: true, initCount: 50, maxTime: 1, minSamples: 5, minTime: -Infinity };

let countFiles = 0;

(async function () {
  const dataBase = await DataBaseRepository.create({ rootFolderPath: CACHE_DIR, dataFolderName: 'data' });
  const suite = new Benchmark.Suite();
  suite
    .add(
      'DataBaseRepository.set',
      async () => {
        countFiles += 1;
        const fileName = getRandomFileName();
        await dataBase.set(fileName, getRandomText(), 1000);
      },
      options,
    )
    .add(
      'DataBaseRepository.set concurrency',
      async () => {
        countFiles += 1;
        await dataBase.set('static', getRandomText(), 1000);
      },
      options,
    )
    .add(
      'DataBaseRepository.set and get',
      async () => {
        countFiles += 1;
        const fileName = getRandomFileName();
        await dataBase.set(fileName, getRandomText(), 1000);
        const data = await dataBase.get(fileName);
        console.log(countFiles, data.substring(0, 5));
      },
      options,
    )
    .add(
      'DataBaseRepository.set and get',
      async () => {
        countFiles += 1;
        const fileName = 'static';
        await dataBase.set(fileName, getRandomText(), 1000);
        const data = await dataBase.get(fileName);
        console.log(countFiles, data.substring(0, 5));
      },
      options,
    )
    .on('cycle', async (event: Benchmark.Event) => {
      console.log(String(event.target));
    })
    .on('complete', async function (this: Benchmark.Suite) {
      console.log(`Fastest is ${this.filter('fastest').map('name')}`);
      console.log('countFiles:', countFiles);
      await dataBase.clear();
    })
    .run(options);
})();
