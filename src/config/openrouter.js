// src/config/openrouter.js
const axios = require('axios');
require('dotenv').config();

class OpenRouterConfig {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseURL = process.env.OPENROUTER_BASE_URL;
        this.model = process.env.OPENROUTER_MODEL;
        
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Rayeva AI System'
            }
        });
    }

    async chatCompletion(messages, temperature = 0.7, maxTokens = 1000) {
        try {
            const response = await this.client.post('/chat/completions', {
                model: this.model,
                messages,
                temperature,
                max_tokens: maxTokens,
                response_format: { type: "json_object" }
            });
            
            return {
                success: true,
                data: response.data,
                prompt: messages,
                response: response.data.choices[0].message.content,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('OpenRouter API Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data || error.message,
                prompt: messages,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = new OpenRouterConfig();