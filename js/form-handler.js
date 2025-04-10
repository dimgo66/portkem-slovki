require('dotenv').config(); // Загружаем переменные окружения из файла .env
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для обработки данных формы
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..'))); // Для доступа к статическим файлам

// Каталог для временных файлов
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Настройка транспорта для отправки email
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true', // Преобразуем строку в булево значение
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Функция для создания Excel-файла
async function createExcelFile(formData) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Заказ билетов');

    // Настройка столбцов
    worksheet.columns = [
        { header: 'Поле', key: 'field', width: 25 },
        { header: 'Значение', key: 'value', width: 50 }
    ];

    // Добавление данных
    worksheet.addRow({ field: 'ФИО', value: formData.name });
    worksheet.addRow({ field: 'Email', value: formData.email });
    worksheet.addRow({ field: 'Телефон', value: formData.phone });
    worksheet.addRow({ field: 'Дата отправления на Соловки', value: formData['date-to'] });
    
    if (formData['date-from']) {
        worksheet.addRow({ field: 'Дата отправления с Соловков', value: formData['date-from'] });
    } else {
        worksheet.addRow({ field: 'Дата отправления с Соловков', value: 'Не указана' });
    }

    let directions = '';
    if (formData.directions) {
        if (Array.isArray(formData.directions)) {
            directions = formData.directions.includes('to') ? 'Рабочеостровск → Соловки' : '';
            directions += formData.directions.includes('from') ? 
                (directions ? ', Соловки → Рабочеостровск' : 'Соловки → Рабочеостровск') : '';
        } else {
            directions = formData.directions === 'to' ? 'Рабочеостровск → Соловки' : 'Соловки → Рабочеостровск';
        }
    }
    worksheet.addRow({ field: 'Направления', value: directions });
    
    worksheet.addRow({ field: 'Взрослых', value: formData.adults });
    worksheet.addRow({ field: 'Детей (3-10 лет)', value: formData.children || '0' });

    // Расчет стоимости
    const adultPrice = 2800;
    const childPrice = 1400;
    const directionsCount = Array.isArray(formData.directions) ? formData.directions.length : (formData.directions ? 1 : 0);
    const totalCost = ((parseInt(formData.adults) * adultPrice) + (parseInt(formData.children || 0) * childPrice)) * directionsCount;
    
    worksheet.addRow({ field: 'Итоговая стоимость', value: `${totalCost} руб.` });
    
    if (formData.comments) {
        worksheet.addRow({ field: 'Комментарии', value: formData.comments });
    }

    // Форматирование заголовка
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' } // Цвет из CSS-стилей
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Создание файла
    const filename = `order_${Date.now()}.xlsx`;
    const filepath = path.join(tempDir, filename);
    await workbook.xlsx.writeFile(filepath);
    
    return { filepath, filename };
}

// Маршрут для обработки данных формы
app.post('/submit-form', async (req, res) => {
    try {
        const formData = req.body;
        
        // Создание Excel-файла
        const { filepath, filename } = await createExcelFile(formData);
        
        // Формирование текста письма
        let emailText = `
            <h2>Новый заказ билетов на Соловки</h2>
            <p><strong>ФИО:</strong> ${formData.name}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Телефон:</strong> ${formData.phone}</p>
            <p><strong>Дата отправления на Соловки:</strong> ${formData['date-to']}</p>
        `;
        
        if (formData['date-from']) {
            emailText += `<p><strong>Дата отправления с Соловков:</strong> ${formData['date-from']}</p>`;
        }
        
        let directions = '';
        if (formData.directions) {
            if (Array.isArray(formData.directions)) {
                if (formData.directions.includes('to')) emailText += `<p>✓ Рабочеостровск → Соловки</p>`;
                if (formData.directions.includes('from')) emailText += `<p>✓ Соловки → Рабочеостровск</p>`;
            } else {
                emailText += `<p>✓ ${formData.directions === 'to' ? 'Рабочеостровск → Соловки' : 'Соловки → Рабочеостровск'}</p>`;
            }
        }
        
        emailText += `
            <p><strong>Взрослых:</strong> ${formData.adults}</p>
            <p><strong>Детей (3-10 лет):</strong> ${formData.children || '0'}</p>
        `;
        
        // Расчет стоимости
        const adultPrice = 2800;
        const childPrice = 1400;
        const directionsCount = Array.isArray(formData.directions) ? formData.directions.length : (formData.directions ? 1 : 0);
        const totalCost = ((parseInt(formData.adults) * adultPrice) + (parseInt(formData.children || 0) * childPrice)) * directionsCount;
        
        emailText += `<p><strong>Итоговая стоимость:</strong> ${totalCost} руб.</p>`;
        
        if (formData.comments) {
            emailText += `<p><strong>Комментарии:</strong> ${formData.comments}</p>`;
        }
        
        // Настройка письма
        const mailOptions = {
            from: `"Причал Рабочеостровск" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_DESTINATION,
            cc: formData.email, // Копия на email клиента
            subject: `Заказ билетов на Соловки от ${formData.name}`,
            html: emailText,
            attachments: [
                {
                    filename: filename,
                    path: filepath
                }
            ]
        };
        
        // Отправка письма
        await transporter.sendMail(mailOptions);
        
        // Удаление временного файла
        fs.unlinkSync(filepath);
        
        res.status(200).json({
            status: 'success',
            message: 'Ваша заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.'
        });
    } catch (error) {
        console.error('Ошибка при обработке формы:', error);
        res.status(500).json({
            status: 'error',
            message: 'Произошла ошибка при отправке формы. Пожалуйста, попробуйте позже.'
        });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Откройте http://localhost:${PORT} в браузере`);
}); 