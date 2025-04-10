const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Настройки для изображений
const imageSettings = [
  { 
    name: 'ship-vasiliy-kosyakov.jpg', 
    title: 'Теплоход "Василий Косяков"', 
    description: 'Комфортабельный двухпалубный теплоход, курсирующий между Рабочеостровском и Соловками',
    color: '#2563eb'
  },
  { 
    name: 'ship-metel.jpg', 
    title: 'Теплоход "Метель"', 
    description: 'Небольшое комфортабельное судно для переправы на Соловки',
    color: '#3b82f6'
  },
  { 
    name: 'hotel-solovetskaya-sloboda.jpg', 
    title: 'Гостиница "Соловецкая Слобода"', 
    description: '55 номеров, 110 мест. Ресторан, банкетный зал. В 10 минутах от Кремля',
    color: '#4b5563'
  },
  { 
    name: 'cafe-kayut-kompania.jpg', 
    title: 'Кафе "Кают-компания"', 
    description: 'Демократичные цены, быстрая подача блюд. Расположено на центральной площади',
    color: '#6b7280'
  },
  { 
    name: 'stary-karbas.jpg', 
    title: 'Кафе "Старый карбас"', 
    description: 'Блюда европейской и поморской кухни. Соловецкие деликатесы. Уютная атмосфера',
    color: '#1f2937'
  },
  { 
    name: 'solovetskaya-izba.jpg', 
    title: 'Ресторан "Соловецкая Изба"', 
    description: 'Фирменные и традиционные блюда. Бар, спутниковое ТВ',
    color: '#374151'
  }
];

// Функция для создания изображения-плейсхолдера
function createDetailedImage(title, description, color, width = 800, height = 400) {
  // Создаем canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Заполняем фон
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  // Добавляем верхний слой с градиентом для эффекта
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Добавляем декоративные элементы
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  
  // Верхняя горизонтальная линия
  ctx.beginPath();
  ctx.moveTo(50, 50);
  ctx.lineTo(width - 50, 50);
  ctx.stroke();
  
  // Нижняя горизонтальная линия
  ctx.beginPath();
  ctx.moveTo(50, height - 50);
  ctx.lineTo(width - 50, height - 50);
  ctx.stroke();

  // Настраиваем текст
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Заголовок
  ctx.font = 'bold 32px Arial';
  ctx.fillText(title, width / 2, height / 2 - 30);

  // Описание
  ctx.font = '20px Arial';
  
  // Разбиваем длинное описание на строки
  const words = description.split(' ');
  let currentLine = '';
  const lines = [];
  const maxWidth = width * 0.8;

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  // Отрисовываем строки
  let lineY = height / 2 + 20;
  for (const line of lines) {
    ctx.fillText(line, width / 2, lineY);
    lineY += 30; // Отступ между строками
  }

  // Возвращаем буфер изображения
  return canvas.toBuffer('image/jpeg', { quality: 0.9 });
}

// Создаем все изображения
async function createImages() {
  const outputDir = path.join(__dirname, '../src');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const image of imageSettings) {
    const outputPath = path.join(outputDir, image.name);
    
    // Создаем изображение
    const imageBuffer = createDetailedImage(image.title, image.description, image.color);
    
    // Сохраняем изображение
    fs.writeFileSync(outputPath, imageBuffer);
    
    console.log(`Создано изображение: ${outputPath}`);
  }
  
  console.log('Все изображения созданы успешно!');
}

createImages().catch(err => console.error('Ошибка:', err)); 