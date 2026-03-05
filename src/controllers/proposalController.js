// src/controllers/proposalController.js
const aiService = require('../services/aiService');
const Proposal = require('../models/Proposal');
const logger = require('../utils/logger');

class ProposalController {
    async generateProposal(req, res, next) {
        try {
            const { businessType, budgetLimit, preferences, sustainabilityGoals } = req.body;

            // Validate input
            if (!businessType || !budgetLimit) {
                return res.status(400).json({
                    success: false,
                    error: 'Business type and budget limit are required'
                });
            }

            if (budgetLimit <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Budget limit must be greater than 0'
                });
            }

            logger.info('Generating proposal for:', { businessType, budgetLimit });

            // Generate proposal using AI
            const aiResult = await aiService.generateB2BProposal({
                businessType,
                budgetLimit: parseFloat(budgetLimit),
                preferences: preferences || [],
                sustainabilityGoals: sustainabilityGoals || []
            });

            if (!aiResult.success) {
                return res.status(500).json({
                    success: false,
                    error: aiResult.error
                });
            }

            // Save to database
            const proposal = new Proposal({
                business_type: businessType,
                budget_limit: budgetLimit,
                preferences: preferences || [],
                sustainability_goals: sustainabilityGoals || [],
                ...aiResult.data,
                prompt_log_id: aiResult.logId
            });

            await proposal.save();
            logger.info('Proposal saved with ID:', proposal._id);

            // Return structured JSON
            res.status(201).json({
                success: true,
                data: {
                    id: proposal._id,
                    business_type: proposal.business_type,
                    budget_allocation: proposal.budget_allocation,
                    product_mix: proposal.product_mix,
                    cost_breakdown: proposal.cost_breakdown,
                    impact_summary: proposal.impact_summary,
                    sustainability_highlights: proposal.sustainability_highlights,
                    created_at: proposal.created_at
                }
            });

        } catch (error) {
            logger.error('Error in generateProposal:', error);
            next(error);
        }
    }

    async getProposal(req, res, next) {
        try {
            const { id } = req.params;
            
            // Validate if ID is a valid ObjectId
            if (!id.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid proposal ID format'
                });
            }

            const proposal = await Proposal.findById(id);
            
            if (!proposal) {
                return res.status(404).json({
                    success: false,
                    error: 'Proposal not found'
                });
            }

            res.json({
                success: true,
                data: proposal
            });
        } catch (error) {
            logger.error('Error in getProposal:', error);
            next(error);
        }
    }

    async listProposals(req, res, next) {
        try {
            const proposals = await Proposal.find()
                .sort({ created_at: -1 })
                .limit(50);
            
            res.json({
                success: true,
                data: proposals
            });
        } catch (error) {
            logger.error('Error in listProposals:', error);
            next(error);
        }
    }
}

module.exports = new ProposalController();