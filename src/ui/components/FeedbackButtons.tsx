/**
 * Feedback Buttons Component
 * Thumbs up/down for user feedback on assistant messages
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface FeedbackButtonsProps {
  messageId: string;
  userId: string;
  userMessage: string;
  assistantResponse: string;
  onFeedbackSubmitted?: (feedback: 'positive' | 'negative') => void;
}

export const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({
  messageId,
  userId,
  userMessage,
  assistantResponse,
  onFeedbackSubmitted
}) => {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCorrectionInput, setShowCorrectionInput] = useState(false);
  const [correction, setCorrection] = useState('');

  const handleFeedback = async (rating: 'positive' | 'negative') => {
    if (isSubmitting || feedback === rating) return;

    setIsSubmitting(true);
    setFeedback(rating);

    try {
      const response = await fetch('http://localhost:5000/api/feedback/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message_id: messageId,
          feedback_type: 'rating',
          rating: rating === 'positive' ? 1 : -1,
          user_message: userMessage,
          assistant_response: assistantResponse
        })
      });

      if (response.ok) {
        console.log(`✅ Feedback submitted: ${rating}`);
        onFeedbackSubmitted?.(rating);
        
        // Show correction input for negative feedback
        if (rating === 'negative') {
          setShowCorrectionInput(true);
        }
      } else {
        console.error('Failed to submit feedback');
        setFeedback(null);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setFeedback(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCorrectionSubmit = async () => {
    if (!correction.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/feedback/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message_id: messageId,
          feedback_type: 'correction',
          correction: correction,
          user_message: userMessage,
          assistant_response: assistantResponse
        })
      });

      if (response.ok) {
        console.log('✅ Correction submitted');
        setShowCorrectionInput(false);
        setCorrection('');
      } else {
        console.error('Failed to submit correction');
      }
    } catch (error) {
      console.error('Error submitting correction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-2">
      {/* Thumbs up/down buttons */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleFeedback('positive')}
          disabled={isSubmitting || feedback !== null}
          className={`p-1 text-sm transition-colors ${
            feedback === 'positive'
              ? 'text-green-500'
              : 'text-gray-400 hover:text-green-500'
          } ${feedback !== null && feedback !== 'positive' ? 'opacity-30' : ''}`}
          title="Good response"
        >
          👍
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleFeedback('negative')}
          disabled={isSubmitting || feedback !== null}
          className={`p-1 text-sm transition-colors ${
            feedback === 'negative'
              ? 'text-red-500'
              : 'text-gray-400 hover:text-red-500'
          } ${feedback !== null && feedback !== 'negative' ? 'opacity-30' : ''}`}
          title="Needs improvement"
        >
          👎
        </motion.button>

        {feedback && (
          <motion.span
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xs text-gray-500"
          >
            {feedback === 'positive' ? 'Thanks!' : 'Feedback noted'}
          </motion.span>
        )}
      </div>

      {/* Correction input for negative feedback */}
      {showCorrectionInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-col gap-2"
        >
          <textarea
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            placeholder="What should I have said instead? (optional)"
            rows={2}
            className="px-2 py-1 text-xs bg-gray-700 text-gray-200 border border-gray-600 focus:border-primary-500 focus:outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCorrectionSubmit}
              disabled={!correction.trim() || isSubmitting}
              className="px-3 py-1 text-xs bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white"
            >
              Submit Correction
            </button>
            <button
              onClick={() => {
                setShowCorrectionInput(false);
                setCorrection('');
              }}
              className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white"
            >
              Skip
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};











