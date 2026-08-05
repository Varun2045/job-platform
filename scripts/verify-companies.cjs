const companies = require('../config/companies.json');
console.log('Total companies:', companies.length);

const newOnes = ['American Express', 'Wells Fargo', 'Barclays', 'UBS', 'Deutsche Bank', 'Fidelity Investments', 'American Airlines GCC', 'Lowe\'s India', 'Warner Bros. Discovery', 'Tesco Bengaluru'];
const sorted = companies.sort((a, b) => a.name.localeCompare(b.name));

newOnes.forEach(name => {
  const found = sorted.find(c => c.name === name);
  if (found) {
    console.log('✓', found.name, '-', found.api_endpoint, '-', found.detected_ats);
  } else {
    console.log('✗', name, 'NOT FOUND');
  }
});