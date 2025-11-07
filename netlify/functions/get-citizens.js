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

        // Запит до NocoDB API
        const response = await fetch(
            `${NOCODB_URL}${TABLE_ID}/records`,
            {
                method: 'GET',
                headers: {
                    'xc-token': API_TOKEN,
                    'Content-Type': 'application/json'
                }
            }
        );

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
        
        // Повертаємо дані клієнту
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                citizens: data.list || data.records || [],
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
