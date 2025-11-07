// netlify/functions/get-citizens.js
exports.handler = async function() {
    const response = await fetch(
        `${process.env.NOCODB_URL}${process.env.TABLE_ID}/records`,
        {
            headers: {
                'xc-token': process.env.NOCODB_TOKEN
            }
        }
    );
    
    const data = await response.json();
    
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
};
