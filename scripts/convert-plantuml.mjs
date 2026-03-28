#!/usr/bin/env node
/**
 * @startuml ~ @enduml 블록을 ```plantuml 코드블록으로 변환
 * astro-plantuml 패키지가 인식할 수 있는 형태로 변환합니다.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

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
      return '```plantuml\n' + match + '\n```';
    }
  );

  if (newContent !== content) {
    writeFileSync(file, newContent, 'utf-8');
    console.log(`✅ ${file}`);
  }
}

console.log(`\n총 ${totalReplaced}개 PlantUML 블록을 코드블록으로 변환 완료!`);
