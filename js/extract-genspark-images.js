const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const outputDir = 'src';
const htmlFilePath = 'genspark.html';

// Создаем директорию для сохранения изображений, если она не существует
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Создана директория ${outputDir}`);
}

async function processHtml() {
  try {
    console.log(`Чтение файла ${htmlFilePath}...`);
    
    // Чтение HTML из файла
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    
    console.log(`Файл ${htmlFilePath} успешно прочитан, размер: ${htmlContent.length} байт`);
    
    // Используем cheerio для более надежного парсинга HTML
    const $ = cheerio.load(htmlContent);
    
    // Найдем все изображения
    const imageUrls = new Set();
    
    // Получаем все src из тегов img
    $('img').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src) {
        imageUrls.add(src);
      }
    });
    
    // Получаем фоновые изображения из inline стилей
    $('[style*="background-image"]').each((i, elem) => {
      const style = $(elem).attr('style');
      const matches = style.match(/url\(['"]?(.*?)['"]?\)/);
      if (matches && matches[1]) {
        imageUrls.add(matches[1]);
      }
    });
    
    // Ищем в CSS блоках в тегах style
    $('style').each((i, elem) => {
      const styleContent = $(elem).html();
      const bgImageMatches = styleContent.match(/background-image:\s*url\(['"]?(.*?)['"]?\)/g);
      
      if (bgImageMatches) {
        bgImageMatches.forEach(match => {
          const urlMatch = match.match(/url\(['"]?(.*?)['"]?\)/);
          if (urlMatch && urlMatch[1]) {
            imageUrls.add(urlMatch[1]);
          }
        });
      }
    });
    
    const uniqueImageUrls = Array.from(imageUrls);
    console.log(`Найдено ${uniqueImageUrls.length} уникальных изображений:`);
    uniqueImageUrls.forEach(url => console.log(`- ${url}`));
    
    return uniqueImageUrls;
  } catch (error) {
    console.error(`Ошибка при обработке HTML: ${error.message}`);
    return [];
  }
}

async function downloadFile(url, outputPath) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Ошибка при загрузке ${url}: ${error.message}`);
  }
}

async function downloadImages(imageUrls) {
  console.log('\nНачинаю загрузку изображений...');
  
  if (!imageUrls || imageUrls.length === 0) {
    console.log('Нет изображений для загрузки');
    return;
  }

  let downloadedCount = 0;
  let errorCount = 0;

  for (const url of imageUrls) {
    try {
      if (!url.startsWith('http')) {
        console.log(`Пропускаю не-URL: ${url}`);
        continue;
      }

      const filename = path.basename(url).split('?')[0];
      const outputPath = path.join(outputDir, filename);
      
      console.log(`Загрузка: ${url}`);
      await downloadFile(url, outputPath);
      console.log(`✅ Сохранено: ${filename}`);
      downloadedCount++;
    } catch (error) {
      console.error(`❌ Не удалось загрузить ${url}: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\nЗагрузка изображений завершена!`);
  console.log(`Успешно загружено: ${downloadedCount}`);
  console.log(`Ошибок: ${errorCount}`);
}

// Основная функция для выполнения всего процесса
async function main() {
  try {
    const imageUrls = await processHtml();
    await downloadImages(imageUrls);
  } catch (error) {
    console.error(`Произошла ошибка: ${error.message}`);
  }
}

main();