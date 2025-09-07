import React, { useState, useEffect } from 'react';
import './Card.css';

const Card = ({ card, onToggleKnown, inStudyMode = false }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    // إعادة ضبط حالة الانقلاب عند تغيير البطاقة
    useEffect(() => {
        setIsFlipped(false);
    }, [card.id]);

    const handleCardClick = () => {
        setIsFlipped(!isFlipped);
    };

    return (
        <div
            className={`card ${isFlipped ? 'flipped' : ''} ${card.known ? 'known' : ''}`}
            onClick={handleCardClick}
        >
            <div className="card-inner">
                <div className="card-front">
                    <h3>{card.question}</h3>
                    {inStudyMode && (
                        <div className="card-hint">
                            <small>Click to reveal answer</small>
                        </div>
                    )}
                </div>
                <div className="card-back">
                    <p>{card.answer}</p>
                </div>
            </div>
        </div>
    );
};

export default Card;