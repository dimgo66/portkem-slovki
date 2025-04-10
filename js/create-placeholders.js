const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Функция для создания изображения-плейсхолдера
function createPlaceholderImage(title, color, width = 800, height = 400) {
  // Создаем canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Заполняем фон
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  // Настраиваем текст
  ctx.fillStyle = 'white';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Добавляем текст
  ctx.fillText(title, width / 2, height / 2);

  // Возвращаем буфер изображения
  return canvas.toBuffer('image/jpeg');
}

// Плейсхолдеры, которые нужно создать
const placeholders = [
  { filename: 'placeholder-ship.jpg', title: 'Теплоход "Василий Косяков"', color: '#3b82f6' },
  { filename: 'placeholder-ship2.jpg', title: 'Теплоход "Метель"', color: '#3b82f6' },
  { filename: 'placeholder-cafe.jpg', title: 'Кафе "Кают-компания"', color: '#4b5563' },
  { filename: 'placeholder-restaurant.jpg', title: 'Ресторан "Соловецкая Изба"', color: '#4b5563' },
  { filename: 'placeholder-cafe2.jpg', title: 'Кафе "Старый карбас"', color: '#4b5563' },
  { filename: 'placeholder-hotel.jpg', title: 'Гостиница "Соловецкая Слобода"', color: '#3b82f6' },
];

// Создаем все плейсхолдеры
async function createPlaceholders() {
  if (!fs.existsSync('../src')) {
    fs.mkdirSync('../src', { recursive: true });
  }

  for (const placeholder of placeholders) {
    const outputPath = path.join('../src', placeholder.filename);
    
    // Создаем изображение
    const imageBuffer = createPlaceholderImage(placeholder.title, placeholder.color);
    
    // Сохраняем изображение
    fs.writeFileSync(outputPath, imageBuffer);
    
    console.log(`Плейсхолдер создан: ${outputPath}`);
  }
  
  console.log('Все плейсхолдеры успешно созданы!');
}

createPlaceholders().catch(err => console.error('Ошибка при создании плейсхолдеров:', err)); 