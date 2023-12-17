import Benchmark from 'benchmark';

let suite = new Benchmark.Suite();

suite.add('exampleTest', async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
})
  .on('cycle', (event: Benchmark.Event) => {
    console.log(String(event.target));
  })
  .on('complete', function(this: Benchmark.Suite) {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ 'async': true });
