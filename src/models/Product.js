// src/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    brand: String,
    
    // AI-generated fields
    primary_category: { type: String, required: true },
    sub_category: String,
    seo_tags: [String],
    sustainability_filters: [String],
    
    // Metadata
    ai_generated: { type: Boolean, default: true },
    prompt_log_id: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);