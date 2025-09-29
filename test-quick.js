// Test rapide
const testCases = ['GAm', 'DEm', 'DG', 'GGG', 'G', 'Am', 'D'];

const regex = /([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)/g;

testCases.forEach(test => {
  const matches = [...test.matchAll(regex)];
  console.log(`"${test}" → [${matches.map(m => `"${m[1]}"`).join(', ')}]`);
});
