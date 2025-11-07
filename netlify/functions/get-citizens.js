// Netlify Serverless Function для безпечного отримання даних з NocoDB
// API ключ зберігається в Environment Variables Netlify

exports.handler = async function(event, context) {
    // Дозволяємо CORS для доступу з браузера
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Обробка preflight запиту
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Перевірка методу
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // Отримуємо дані з Environment Variables (безпечно!)
        const NOCODB_URL = process.env.NOCODB_API_URL;
        const TABLE_ID = process.env.NOCODB_TABLE_ID;
        const API_TOKEN = process.env.NOCODB_API_TOKEN;

        // Перевірка наявності змінних
        if (!NOCODB_URL || !TABLE_ID || !API_TOKEN) {
            console.error('Environment variables not configured');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'Server configuration error',
                    message: 'NocoDB credentials not configured'
                })
            };
        }

        // Отримуємо всі записи (з пагінацією)
        let allRecords = [];
        let offset = 0;
        const limit = 100; // Кількість записів за один запит
        let hasMore = true;

        while (hasMore) {
            // Запит до NocoDB API з параметрами пагінації
            const url = `${NOCODB_URL}${TABLE_ID}/records?limit=${limit}&offset=${offset}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'xc-token': API_TOKEN,
                    'Content-Type': 'application/json'
                }
            });

            // Перевірка відповіді
            if (!response.ok) {
                console.error(`NocoDB API error: ${response.status}`);
                return {
                    statusCode: response.status,
                    headers,
                    body: JSON.stringify({ 
                        error: 'NocoDB API error',
                        status: response.status 
                    })
                };
            }

            // Отримуємо дані
            const data = await response.json();
            const records = data.list || data.records || [];
            
            // Додаємо отримані записи
            allRecords = allRecords.concat(records);
            
            // Перевіряємо, чи є ще записи
            if (records.length < limit) {
                hasMore = false; // Це був останній запит
            } else {
                offset += limit; // Переходимо до наступної сторінки
            }

            // Захист від безкінечного циклу (максимум 10000 записів)
            if (offset >= 10000) {
                console.warn('Reached maximum records limit (10000)');
                hasMore = false;
            }
        }

        console.log(`Successfully fetched ${allRecords.length} records`);
        
        // Повертаємо всі дані клієнту
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                citizens: allRecords,
                total: allRecords.length,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};
