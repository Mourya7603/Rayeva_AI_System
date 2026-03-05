// src/services/aiService.js
const openrouter = require('../config/openrouter');
const logger = require('../utils/logger');

class AIService {
    constructor() {
        this.promptLogs = [];
    }

    logPrompt(prompt, response, module) {
        const logEntry = {
            id: Date.now().toString(),
            module,
            prompt,
            response,
            timestamp: new Date().toISOString()
        };
        this.promptLogs.push(logEntry);
        logger.info(`AI Prompt Log [${module}]:`, logEntry);
        return logEntry;
    }

    async generateCategoryTags(productData) {
        const prompt = `You are an AI assistant for a sustainable e-commerce platform. Analyze the following product and generate structured output.

Product Information:
- Name: ${productData.name}
- Description: ${productData.description}
- Price: ${productData.price}
- Brand: ${productData.brand || 'Unknown'}

Available Categories: Electronics, Clothing, Home & Garden, Beauty, Food & Beverage, Sports, Toys, Books, Automotive, Health

Sustainability Filters: plastic-free, compostable, vegan, recycled, biodegradable, organic, fair-trade, zero-waste, cruelty-free, sustainable-material

Generate a JSON response with:
1. primary_category: Choose ONE from the available categories list
2. sub_category: Suggest a specific sub-category
3. seo_tags: Array of 5-10 relevant SEO tags
4. sustainability_filters: Array of applicable sustainability filters from the provided list

Return ONLY valid JSON without any additional text.`;

        const messages = [
            { role: "system", content: "You are a product categorization expert for sustainable products." },
            { role: "user", content: prompt }
        ];

        const result = await openrouter.chatCompletion(messages, 0.3, 800);
        
        // Log the interaction
        this.logPrompt(prompt, result, 'category-tag-generator');
        
        if (result.success) {
            try {
                const parsedResponse = JSON.parse(result.response);
                return {
                    success: true,
                    data: parsedResponse,
                    logId: this.promptLogs[this.promptLogs.length - 1].id
                };
            } catch (error) {
                return {
                    success: false,
                    error: 'Failed to parse AI response',
                    rawResponse: result.response
                };
            }
        }
        
        return result;
    }

    async generateB2BProposal(requestData) {
        const prompt = `You are an AI assistant for sustainable B2B procurement. Generate a sustainable product mix proposal.

Request Details:
- Business Type: ${requestData.businessType}
- Budget Limit: $${requestData.budgetLimit}
- Preferences: ${requestData.preferences?.join(', ') || 'None specified'}
- Sustainability Goals: ${requestData.sustainabilityGoals?.join(', ') || 'General sustainability'}

Generate a JSON response with:
1. product_mix: Array of suggested products with name, quantity, unit_price, total_price, sustainability_features
2. budget_allocation: Object with total_cost, remaining_budget, utilization_percentage
3. cost_breakdown: Object with products_cost, shipping_estimate, taxes_estimate, total
4. impact_summary: String describing environmental and social impact
5. sustainability_highlights: Array of key sustainability features across the mix

Ensure total_cost does not exceed budget limit. Return ONLY valid JSON.`;

        const messages = [
            { role: "system", content: "You are a sustainable procurement specialist." },
            { role: "user", content: prompt }
        ];

        const result = await openrouter.chatCompletion(messages, 0.5, 1200);
        
        // Log the interaction
        this.logPrompt(prompt, result, 'b2b-proposal-generator');
        
        if (result.success) {
            try {
                const parsedResponse = JSON.parse(result.response);
                
                // Validate budget
                if (parsedResponse.budget_allocation?.total_cost > requestData.budgetLimit) {
                    return {
                        success: false,
                        error: 'Generated proposal exceeds budget limit',
                        proposal: parsedResponse
                    };
                }
                
                return {
                    success: true,
                    data: parsedResponse,
                    logId: this.promptLogs[this.promptLogs.length - 1].id
                };
            } catch (error) {
                return {
                    success: false,
                    error: 'Failed to parse AI response',
                    rawResponse: result.response
                };
            }
        }
        
        return result;
    }

    async generateImpactReport(orderData) {
        // Simplified impact calculation logic (non-AI for demo)
        const plasticSaved = this.calculatePlasticSaved(orderData.items);
        const carbonAvoided = this.calculateCarbonAvoided(orderData.items);
        const localSourcingImpact = this.calculateLocalSourcingImpact(orderData.items);
        
        const impactStatement = `This order has saved approximately ${plasticSaved}kg of plastic waste and avoided ${carbonAvoided}kg of CO2 emissions. ${localSourcingImpact}`;
        
        return {
            success: true,
            data: {
                plastic_saved: plasticSaved,
                carbon_avoided: carbonAvoided,
                local_sourcing_impact: localSourcingImpact,
                impact_statement: impactStatement,
                items_analyzed: orderData.items.length
            }
        };
    }

    // Helper methods for impact calculation
    calculatePlasticSaved(items) {
        return items.reduce((total, item) => {
            return total + (item.plastic_free ? 0.5 : 0.1);
        }, 0).toFixed(2);
    }

    calculateCarbonAvoided(items) {
        return items.reduce((total, item) => {
            return total + (item.sustainable ? 2.5 : 0.5);
        }, 0).toFixed(2);
    }

    calculateLocalSourcingImpact(items) {
        const localItems = items.filter(item => item.local_sourced).length;
        const totalItems = items.length;
        
        if (localItems === 0) return "No locally sourced items in this order.";
        return `${localItems} out of ${totalItems} items were locally sourced, supporting community businesses and reducing transportation emissions.`;
    }

    async handleWhatsAppQuery(query, userData) {
        const prompt = `You are a customer support AI for a sustainable e-commerce platform. Handle the following query:

User Query: ${query}
User Context: ${JSON.stringify(userData)}

Available Actions:
- Order status queries: Check database for order status
- Return policy: Provide standard return policy information
- Escalate: Identify refund-related or high-priority issues

Determine the intent and respond appropriately. For order queries, ask for order ID.
For returns, explain our 30-day sustainable return policy.
For escalations, provide acknowledgment and escalation path.

Return JSON with:
1. intent: (order_status/return_policy/escalate/general)
2. response: Your helpful response
3. requires_escalation: boolean
4. action_needed: (provide_order_id/transfer_to_human/none)
5. confidence_score: 0-1`;

        const messages = [
            { role: "system", content: "You are a helpful customer support agent specializing in sustainable products." },
            { role: "user", content: prompt }
        ];

        const result = await openrouter.chatCompletion(messages, 0.3, 600);
        
        this.logPrompt(prompt, result, 'whatsapp-support');
        
        if (result.success) {
            try {
                const parsedResponse = JSON.parse(result.response);
                return {
                    success: true,
                    data: parsedResponse,
                    logId: this.promptLogs[this.promptLogs.length - 1].id
                };
            } catch (error) {
                return {
                    success: false,
                    error: 'Failed to parse AI response'
                };
            }
        }
        
        return result;
    }

    getPromptLogs(module = null) {
        if (module) {
            return this.promptLogs.filter(log => log.module === module);
        }
        return this.promptLogs;
    }
}

module.exports = new AIService();