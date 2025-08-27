import React, { useState, useContext, useEffect } from 'react';
import { CardsContext } from '../../context/CardsContext';
import './DeckForm.css';

const DeckForm = ({ deckId = null, onSave, onCancel }) => {
    const { decks, addDeck, editDeck } = useContext(CardsContext);
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });
    const [errors, setErrors] = useState({});

    // Load deck data if editing an existing deck
    useEffect(() => {
        if (deckId) {
            const deck = decks.find(d => d.id === deckId);
            if (deck) {
                setFormData({
                    title: deck.title,
                    description: deck.description
                });
            }
        }
    }, [deckId, decks]);

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

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.length > 50) {
            newErrors.title = 'Title must be less than 50 characters';
        }

        if (formData.description.length > 200) {
            newErrors.description = 'Description must be less than 200 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            if (deckId) {
                // Edit existing deck
                editDeck({
                    id: deckId,
                    ...formData
                });
            } else {
                // Add new deck
                addDeck(formData);
            }

            onSave();
        }
    };

    return (
        <div className="deck-form-container">
            <h2>{deckId ? 'Edit Deck' : 'Create New Deck'}</h2>
            <form onSubmit={handleSubmit} className="deck-form">
                <div className="form-group">
                    <label htmlFor="title">Deck Title *</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter deck title"
                        className={errors.title ? 'input-error' : ''}
                    />
                    {errors.title && <div className="error-message">{errors.title}</div>}
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter deck description"
                        rows="3"
                        className={errors.description ? 'input-error' : ''}
                    ></textarea>
                    {errors.description && <div className="error-message">{errors.description}</div>}
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                        {deckId ? 'Update Deck' : 'Create Deck'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DeckForm;