const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Путь к HTML-файлу и папке для сохранения изображений
const htmlFilePath = '../index.html';
const outputDir = '../src';

// Создание папки, если она не существует
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Чтение HTML-файла
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

// Добавляем фавиконы
$('link[rel="icon"], link[rel="apple-touch-icon"]').each((i, elem) => {
  const href = $(elem).attr('href');
  if (href && !imageSrcs.includes(href)) {
    imageSrcs.push(href);
  }
});

// Копирование локальных изображений и скачивание внешних
async function downloadImages() {
  console.log(`Найдено ${imageSrcs.length} изображений для обработки.`);
  
  for (const src of imageSrcs) {
    try {
      const fileName = src.split('/').pop().split('?')[0];
      const outputPath = path.join(outputDir, fileName);
      
      // Если это относительный путь (локальный файл)
      if (!src.startsWith('http')) {
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, outputPath);
          console.log(`Скопирован локальный файл: ${src} -> ${outputPath}`);
        } else {
          console.log(`Локальный файл не найден: ${src}`);
        }
      } else {
        // Если это URL (внешний файл)
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
        
        console.log(`Загружен внешний файл: ${src} -> ${outputPath}`);
      }
    } catch (error) {
      console.error(`Ошибка при обработке ${src}:`, error.message);
    }
  }
}

downloadImages()
  .then(() => console.log('Скачивание изображений завершено.'))
  .catch(err => console.error('Произошла ошибка:', err)); 