const companies = require('../config/companies.json');
const companiesToAdd = ['American Express', 'Wells Fargo', 'Barclays', 'UBS', 'Deutsche Bank', 'Fidelity Investments', 'American Airlines GCC', 'Lowe\'s India', 'Warner Bros. Discovery', 'Tesco Bengaluru'];

companiesToAdd.forEach(name => {
  const exists = companies.some(c => c.name.toLowerCase() === name.toLowerCase());
  console.log(name + ':', exists ? 'EXISTS' : 'NOT FOUND');
});