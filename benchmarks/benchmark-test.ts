import Benchmark from 'benchmark';

import { DataBaseRepository } from '../src/data-base.repository';

const CACHE_DIR = '../.cache';

function getRandomFileName() {
  return Math.random().toString(36).substring(7);
}

const options = { async: true, initCount: 50, maxTime: 1, minSamples: 5, minTime: -Infinity };

let countFiles = 0;
let dataBase: DataBaseRepository;

const suite = new Benchmark.Suite();
suite
  .add(
    'DataBaseRepository.set',
    async () => {
      countFiles += 1;
      const fileName = getRandomFileName();
      await dataBase.set(fileName, 'test', 0);
    },
    options,
  )
  .add(
    'DataBaseRepository.set concurrency',
    async () => {
      countFiles += 1;
      const fileName = 'test';
      await dataBase.set(fileName, 'test', 0);
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
  .on('start', async () => {
    dataBase = await DataBaseRepository.create({ rootFolderPath: CACHE_DIR, dataFolderName: 'data' });
  })
  .run(options);
