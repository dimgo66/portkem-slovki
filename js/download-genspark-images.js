const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Путь к HTML-файлу и папке для сохранения изображений
const htmlFilePath = 'genspark.html';
const outputDir = 'src';

// Создание папки, если она не существует
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Чтение HTML-файла
console.log(`Чтение файла ${htmlFilePath}...`);
const html = fs.readFileSync(htmlFilePath, 'utf8');
const $ = cheerio.load(html);

// Поиск всех изображений
const imageSrcs = [];

// Получаем все src из тегов img
$('img').each((i, elem) => {
  const src = $(elem).attr('src');
  if (src && !imageSrcs.includes(src)) {
    imageSrcs.push(src);
  }
});

// Получаем фоновые изображения из стилей
// Ищем в inline стилях
$('[style*="background-image"]').each((i, elem) => {
  const style = $(elem).attr('style');
  const matches = style.match(/url\(['"]?(.*?)['"]?\)/);
  if (matches && matches[1] && !imageSrcs.includes(matches[1])) {
    imageSrcs.push(matches[1]);
  }
});

// Ищем в CSS блоках
$('style').each((i, elem) => {
  const styleContent = $(elem).html();
  const bgImageMatches = styleContent.match(/background-image:\s*url\(['"]?(.*?)['"]?\)/g);
  
  if (bgImageMatches) {
    bgImageMatches.forEach(match => {
      const urlMatch = match.match(/url\(['"]?(.*?)['"]?\)/);
      if (urlMatch && urlMatch[1] && !imageSrcs.includes(urlMatch[1])) {
        imageSrcs.push(urlMatch[1]);
      }
    });
  }
});

console.log(`Найдено ${imageSrcs.length} изображений:`);
imageSrcs.forEach(src => console.log(`- ${src}`));

// Загрузка изображений
async function downloadImages() {
  console.log('\nНачинаю загрузку изображений...');
  
  for (const src of imageSrcs) {
    try {
      // Получаем имя файла из URL
      const fileName = path.basename(src);
      const outputPath = path.join(outputDir, fileName);
      
      // Если это URL, скачиваем файл
      if (src.startsWith('http')) {
        console.log(`Загрузка: ${src}`);
        
        const response = await axios({
          method: 'GET',
          url: src,
          responseType: 'stream'
        });
        
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        
        console.log(`✅ Изображение сохранено: ${outputPath}`);
      } else {
        console.log(`❌ Пропущен локальный файл: ${src}`);
      }
    } catch (error) {
      console.error(`❌ Ошибка при загрузке ${src}:`, error.message);
    }
  }
  
  console.log('Загрузка изображений завершена!');
}

downloadImages(); 