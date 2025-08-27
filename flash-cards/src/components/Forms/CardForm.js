import React, { useState, useEffect } from 'react';
import './CardForm.css';

const CardForm = ({ card = null, onSave, onCancel, deckId }) => {
    const [formData, setFormData] = useState({
        question: '',
        answer: ''
    });
    const [errors, setErrors] = useState({});

    // Load card data if editing an existing card
    useEffect(() => {
        if (card) {
            setFormData({
                question: card.question,
                answer: card.answer
            });
        }
    }, [card]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.question.trim()) {
            newErrors.question = 'Question is required';
        }

        if (!formData.answer.trim()) {
            newErrors.answer = 'Answer is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            if (card) {
                // Edit existing card
                onSave({
                    ...card,
                    ...formData
                });
            } else {
                // Add new card
                onSave(formData);
            }
        }
    };

    return (
        <div className="card-form-container">
            <h2>{card ? 'Edit Card' : 'Add New Card'}</h2>
            <form onSubmit={handleSubmit} className="card-form">
                <div className="form-group">
                    <label htmlFor="question">Question *</label>
                    <textarea
                        id="question"
                        name="question"
                        value={formData.question}
                        onChange={handleChange}
                        placeholder="Enter the question for the card"
                        rows="3"
                        className={errors.question ? 'input-error' : ''}
                    ></textarea>
                    {errors.question && <div className="error-message">{errors.question}</div>}
                </div>

                <div className="form-group">
                    <label htmlFor="answer">Answer *</label>
                    <textarea
                        id="answer"
                        name="answer"
                        value={formData.answer}
                        onChange={handleChange}
                        placeholder="Enter the answer for the card"
                        rows="3"
                        className={errors.answer ? 'input-error' : ''}
                    ></textarea>
                    {errors.answer && <div className="error-message">{errors.answer}</div>}
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                        {card ? 'Update Card' : 'Add Card'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CardForm;