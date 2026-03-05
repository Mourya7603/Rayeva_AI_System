// src/controllers/categoryController.js
const aiService = require('../services/aiService');
const Product = require('../models/Product');
const logger = require('../utils/logger');

class CategoryController {
    async generateCategory(req, res, next) {
        try {
            const { name, description, price, brand } = req.body;
            
            // Validate input
            if (!name || !description || !price) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields'
                });
            }

            // Generate categories and tags using AI
            const aiResult = await aiService.generateCategoryTags({
                name,
                description,
                price,
                brand
            });

            if (!aiResult.success) {
                return res.status(500).json({
                    success: false,
                    error: aiResult.error
                });
            }

            // Save to database
            const product = new Product({
                name,
                description,
                price,
                brand,
                ...aiResult.data,
                prompt_log_id: aiResult.logId
            });

            await product.save();

            // Return structured JSON
            res.status(201).json({
                success: true,
                data: {
                    id: product._id,
                    name: product.name,
                    primary_category: product.primary_category,
                    sub_category: product.sub_category,
                    seo_tags: product.seo_tags,
                    sustainability_filters: product.sustainability_filters,
                    created_at: product.created_at
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async getProduct(req, res, next) {
        try {
            const product = await Product.findById(req.params.id);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }

            res.json({
                success: true,
                data: product
            });
        } catch (error) {
            next(error);
        }
    }

    async getPromptLogs(req, res, next) {
        try {
            const logs = aiService.getPromptLogs(req.query.module);
            res.json({
                success: true,
                data: logs
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CategoryController();