import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const pdfPath = 'c:/Users/varun/Downloads/Resume_VarunDamani.pdf';
const dataBuffer = fs.readFileSync(pdfPath);

const parser = new pdf.PDFParse({ data: dataBuffer });
parser.getText().then(function(result) {
  console.log('--- PDF Text Start ---');
  console.log(result.text);
  console.log('--- PDF Text End ---');
}).catch(err => {
  console.error('Error parsing PDF:', err);
});
