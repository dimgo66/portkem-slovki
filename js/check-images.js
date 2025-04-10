const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Путь к HTML-файлу
const htmlFilePath = '../index.html';

// Чтение HTML-файла
const html = fs.readFileSync(htmlFilePath, 'utf8');
const $ = cheerio.load(html);

// Поиск всех путей к изображениям
const imagePaths = new Set();

// Получаем все src из тегов img
$('img').each((i, elem) => {
  const src = $(elem).attr('src');
  if (src) {
    imagePaths.add(src);
  }
});

// Получаем фоновые изображения из стилей
// Ищем в CSS блоках
$('style').each((i, elem) => {
  const styleContent = $(elem).html();
  if (styleContent) {
    const bgImageMatches = styleContent.match(/background-image:\s*url\(['"]?(.*?)['"]?\)/g);
    
    if (bgImageMatches) {
      bgImageMatches.forEach(match => {
        const urlMatch = match.match(/url\(['"]?(.*?)['"]?\)/);
        if (urlMatch && urlMatch[1]) {
          imagePaths.add(urlMatch[1]);
        }
      });
    }
  }
});

// Добавляем фавиконы
$('link[rel="icon"], link[rel="apple-touch-icon"]').each((i, elem) => {
  const href = $(elem).attr('href');
  if (href) {
    imagePaths.add(href);
  }
});

// Проверяем существование каждого изображения
console.log('Проверка изображений:');
console.log('=====================');

const allExists = [...imagePaths].every(imagePath => {
  // Проверяем только локальные пути, начинающиеся с "src/"
  if (imagePath.startsWith('src/')) {
    // Преобразуем путь, добавляя ../, поскольку скрипт запускается из папки js
    const adjustedPath = path.join('..', imagePath);
    const exists = fs.existsSync(adjustedPath);
    console.log(`${exists ? '✅' : '❌'} ${imagePath} ${exists ? 'существует' : 'отсутствует'}`);
    return exists;
  } else {
    console.log(`⚠️ ${imagePath} (внешний или не в папке src)`);
    return true;
  }
});

console.log('=====================');
if (allExists) {
  console.log('✅ Все локальные изображения найдены!');
} else {
  console.log('❌ Некоторые изображения отсутствуют!');
} 