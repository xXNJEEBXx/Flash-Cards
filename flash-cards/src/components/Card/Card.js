import React, { useState, useEffect } from 'react';
import { translateCard } from '../../services/translationService';
import './Card.css';

const Card = ({
    card,
    onToggleKnown,
    inStudyMode = false,
    showTranslation: propShowTranslation,
    translatedQuestion: propTranslatedQuestion,
    translatedAnswer: propTranslatedAnswer,
    isTranslating: propIsTranslating,
    onToggleTranslation,
    onSaveTranslation
}) => {
    const [isFlipped, setIsFlipped] = useState(false);
    
    // حالة محلية للترجمة إذا لم يتم توفيرها من المكون الأب
    const [localShowTranslation, setLocalShowTranslation] = useState(false);
    const [localTranslatedQuestion, setLocalTranslatedQuestion] = useState('');
    const [localTranslatedAnswer, setLocalTranslatedAnswer] = useState('');
    const [localIsTranslating, setLocalIsTranslating] = useState(false);

    // إعادة ضبط حالة الانقلاب والترجمة عند تغيير البطاقة
    useEffect(() => {
        setIsFlipped(false);
        setLocalShowTranslation(false);
    }, [card?.id]);

    const handleCardClick = () => {
        // إذا كان المستخدم يحدد نصاً للنسخ، لا نقلب البطاقة
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            return;
        }
        setIsFlipped(prev => !prev);
    };

    // تحديد القيم النشطة (من الـ props أو الحالة المحلية)
    const isTranslationActive = propShowTranslation !== undefined ? propShowTranslation : localShowTranslation;
    const activeTranslatedQuestion = propTranslatedQuestion !== undefined ? propTranslatedQuestion : localTranslatedQuestion;
    const activeTranslatedAnswer = propTranslatedAnswer !== undefined ? propTranslatedAnswer : localTranslatedAnswer;
    const activeIsTranslating = propIsTranslating !== undefined ? propIsTranslating : localIsTranslating;

    // استدعاء الترجمة
    const triggerTranslate = async () => {
        if (onToggleTranslation) {
            onToggleTranslation();
            return;
        }

        // معالجة محلية
        if (localShowTranslation) {
            setLocalShowTranslation(false);
            return;
        }

        if (localTranslatedQuestion && localTranslatedAnswer) {
            setLocalShowTranslation(true);
            return;
        }

        setLocalIsTranslating(true);
        try {
            const res = await translateCard(card);
            if (res) {
                setLocalTranslatedQuestion(res.translatedQuestion || '');
                setLocalTranslatedAnswer(res.translatedAnswer || '');
                setLocalShowTranslation(true);
            }
        } catch (err) {
            console.error('Translation failed:', err);
        } finally {
            setLocalIsTranslating(false);
        }
    };

    const handleSave = () => {
        if (onSaveTranslation) {
            onSaveTranslation(activeTranslatedQuestion, activeTranslatedAnswer);
        }
    };

    // التحقق من وجود خصائص النظام الذكي
    const isSmartModeActive = card.smartModeHighlight || card.isHighPriority || card.isInReviewMode;

    return (
        <div
            className={`card ${isFlipped ? 'flipped' : ''} 
                       ${card.known ? 'known' : ''} 
                       ${isSmartModeActive ? 'smart-mode-active' : ''}
                       ${card.isHighPriority ? 'high-priority' : ''}
                       ${card.isInReviewMode ? 'review-mode' : ''}`}
            onClick={handleCardClick}
        >
            <div className="card-inner">
                {/* الوجه الأمامي (السؤال) */}
                <div className="card-front">
                    {/* زر الترجمة السريع في الزاوية */}
                    <button
                        className={`card-quick-translate-btn ${activeIsTranslating ? 'loading' : ''} ${isTranslationActive ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            triggerTranslate();
                        }}
                        title="ترجمة البطاقة إلى العربية"
                    >
                        <span>{activeIsTranslating ? '⏳' : '🌐'}</span>
                        <span>{activeIsTranslating ? 'جاري الترجمة...' : isTranslationActive ? 'إخفاء الترجمة' : 'ترجمة'}</span>
                    </button>

                    <h3>{card.question}</h3>

                    {/* صندوق الترجمة العربية للوجه الأمامي */}
                    {isTranslationActive && activeTranslatedQuestion && (
                        <div className="card-translation-box front-translation" dir="rtl" onClick={(e) => e.stopPropagation()}>
                            <div className="translation-header">
                                <span className="translation-badge">🌐 الترجمة العربية للسؤال:</span>
                                {onSaveTranslation && (
                                    <button
                                        className="btn-save-translation"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSave();
                                        }}
                                        title="حفظ الترجمة في البطاقة نهائياً"
                                    >
                                        💾 حفظ في البطاقة
                                    </button>
                                )}
                            </div>
                            <div className="translation-text">{activeTranslatedQuestion}</div>
                        </div>
                    )}

                    {inStudyMode && (
                        <div className="card-hint">
                            <small>Click to reveal answer</small>
                        </div>
                    )}
                </div>

                {/* الوجه الخلفي (الجواب) */}
                <div className="card-back">
                    {/* زر الترجمة السريع في الزاوية */}
                    <button
                        className={`card-quick-translate-btn ${activeIsTranslating ? 'loading' : ''} ${isTranslationActive ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            triggerTranslate();
                        }}
                        title="ترجمة البطاقة إلى العربية"
                    >
                        <span>{activeIsTranslating ? '⏳' : '🌐'}</span>
                        <span>{activeIsTranslating ? 'جاري الترجمة...' : isTranslationActive ? 'إخفاء الترجمة' : 'ترجمة'}</span>
                    </button>

                    <p>{card.answer}</p>

                    {/* صندوق الترجمة العربية للوجه الخلفي */}
                    {isTranslationActive && activeTranslatedAnswer && (
                        <div className="card-translation-box back-translation" dir="rtl" onClick={(e) => e.stopPropagation()}>
                            <div className="translation-header">
                                <span className="translation-badge">🌐 الترجمة العربية للإجابة:</span>
                                {onSaveTranslation && (
                                    <button
                                        className="btn-save-translation"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSave();
                                        }}
                                        title="حفظ الترجمة في البطاقة نهائياً"
                                    >
                                        💾 حفظ في البطاقة
                                    </button>
                                )}
                            </div>
                            <div className="translation-text">{activeTranslatedAnswer}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Card;