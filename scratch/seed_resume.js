import fs from 'fs';
import { PDFParse } from 'pdf-parse';

const pdfPath = 'c:/Users/varun/Downloads/Resume_VarunDamani.pdf';
const databasePath = 'c:/Users/varun/Downloads/Job Monitor/storage/user_resumes.json';

try {
  const buffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const content = result.text || '';
  
  const resumes = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
  const idx = resumes.findIndex(r => r.userId === '00000000-0000-0000-0000-000000000000' && r.profileName === 'Resume_VarunDamani');
  const item = {
    userId: '00000000-0000-0000-0000-000000000000',
    profileName: 'Resume_VarunDamani',
    content: content,
    created_at: new Date().toISOString()
  };
  
  if (idx !== -1) {
    resumes[idx] = item;
  } else {
    resumes.push(item);
  }
  
  fs.writeFileSync(databasePath, JSON.stringify(resumes, null, 2));
  console.log('Successfully seeded Varun Damani resume as a string into CRM database.');
} catch (err) {
  console.error('Error seeding resume:', err);
}
