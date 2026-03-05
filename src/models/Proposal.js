// src/models/Proposal.js
const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
    business_type: String,
    budget_limit: Number,
    preferences: [String],
    sustainability_goals: [String],
    
    // AI-generated content
    product_mix: [{
        name: String,
        quantity: Number,
        unit_price: Number,
        total_price: Number,
        sustainability_features: [String]
    }],
    budget_allocation: {
        total_cost: Number,
        remaining_budget: Number,
        utilization_percentage: Number
    },
    cost_breakdown: {
        products_cost: Number,
        shipping_estimate: Number,
        taxes_estimate: Number,
        total: Number
    },
    impact_summary: String,
    sustainability_highlights: [String],
    
    // Metadata
    status: { type: String, default: 'draft' },
    prompt_log_id: String,
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Proposal', proposalSchema);