#!/usr/bin/env node
/**
 * PlantUML 전처리 스크립트
 * src/content/docs 내 모든 .md 파일에서 @startuml ~ @enduml 블록을
 * PlantUML 서버 이미지로 변환합니다.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { globSync } from 'node:fs';
import { execSync } from 'node:child_process';

const PLANTUML_SERVER = 'https://www.plantuml.com/plantuml/svg';

function encodePlantUML(text) {
  const compressed = deflateSync(Buffer.from(text, 'utf-8'), { level: 9 });
  return '~1' + compressed.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// find all md files
const files = execSync('find src/content/docs -name "*.md"', { encoding: 'utf-8' })
  .trim().split('\n').filter(Boolean);

let totalReplaced = 0;

for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  if (!content.includes('@startuml')) continue;

  const newContent = content.replace(
    /@startuml[\s\S]*?@enduml/g,
    (match) => {
      totalReplaced++;
      const encoded = encodePlantUML(match);
      const url = `${PLANTUML_SERVER}/${encoded}`;
      return `<img src="${url}" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />`;
    }
  );

  if (newContent !== content) {
    writeFileSync(file, newContent, 'utf-8');
    console.log(`✅ ${file}`);
  }
}

console.log(`\n총 ${totalReplaced}개 PlantUML 다이어그램 변환 완료!`);
