import { deflateSync } from 'node:zlib';

/**
 * PlantUML 텍스트를 PlantUML 서버 URL로 인코딩
 */
function encodePlantUML(text) {
  const compressed = deflateSync(Buffer.from(text, 'utf-8'), { level: 9 });
  const base64 = compressed.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `~1${base64}`;
}

const PLANTUML_SERVER = 'https://www.plantuml.com/plantuml/svg';

/**
 * Remark plugin: raw markdown 텍스트에서 @startuml ~ @enduml 블록을 이미지로 변환
 * VuePress의 markdown-it-plantuml과 동일한 동작
 */
export function remarkPlantuml() {
  return (tree, file) => {
    // file.value (raw markdown string)에서 직접 치환
    if (!file.value || typeof file.value !== 'string') return;
    if (!file.value.includes('@startuml')) return;

    // @startuml ~ @enduml 블록을 이미지 태그로 치환
    file.value = file.value.replace(
      /@startuml[\s\S]*?@enduml/g,
      (match) => {
        const encoded = encodePlantUML(match);
        const url = `${PLANTUML_SERVER}/${encoded}`;
        return `\n\n<img src="${url}" alt="PlantUML Diagram" style="max-width:100%;background:white;padding:1rem;" />\n\n`;
      }
    );
  };
}
