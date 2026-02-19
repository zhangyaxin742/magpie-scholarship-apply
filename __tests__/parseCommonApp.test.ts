// test.ts
import { parseWithHaiku } from './lib/parseWithHaiku';
import fs from 'fs';
import pdf from 'pdf-parse';

async function test() {
  const buffer = fs.readFileSync('./test.pdf');
  const pdfData = await pdf(buffer);
  
  const result = await parseWithHaiku(pdfData.text);
  
  console.log(JSON.stringify(result, null, 2));
}

test();