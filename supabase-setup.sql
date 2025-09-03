-- إنشاء جداول Flash Cards في Supabase
-- نفذ هذا السكريبت في SQL Editor في لوحة تحكم Supabase

-- جدول المجموعات (Decks)
CREATE TABLE IF NOT EXISTS decks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول البطاقات (Cards)
CREATE TABLE IF NOT EXISTS cards (
    id BIGSERIAL PRIMARY KEY,
    deck_id BIGINT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    known BOOLEAN DEFAULT FALSE,
    times_seen INTEGER DEFAULT 0,
    times_known INTEGER DEFAULT 0,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    last_known_at TIMESTAMP WITH TIME ZONE,
    is_difficult BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_cards_known ON cards(known);
CREATE INDEX IF NOT EXISTS idx_cards_is_difficult ON cards(is_difficult);

-- تفعيل Row Level Security (أمان على مستوى الصف)
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان (تسمح بالقراءة والكتابة للجميع - يمكن تخصيصها لاحقاً)
CREATE POLICY "Enable read access for all users" ON decks FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON decks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON decks FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON decks FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON cards FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON cards FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON cards FOR DELETE USING (true);

-- إدراج بيانات عينة (مجموعة Cybersecurity)
INSERT INTO decks (title, description) VALUES 
('Cybersecurity Concepts', 'A comprehensive deck of cybersecurity terms and concepts in both English and Arabic')
ON CONFLICT DO NOTHING;

-- الحصول على ID المجموعة المدرجة
DO $$
DECLARE
    deck_id BIGINT;
BEGIN
    SELECT id INTO deck_id FROM decks WHERE title = 'Cybersecurity Concepts' LIMIT 1;
    
    -- إدراج بطاقات عينة
    INSERT INTO cards (deck_id, question, answer) VALUES 
    (deck_id, 'What is a Firewall?', 'A network security device that monitors and controls incoming and outgoing network traffic based on predetermined security rules'),
    (deck_id, 'ما هو الجدار الناري؟', 'جهاز أمان الشبكة الذي يراقب ويتحكم في حركة مرور الشبكة الواردة والصادرة بناءً على قواعد الأمان المحددة مسبقاً'),
    (deck_id, 'What is Phishing?', 'A cyber attack that uses disguised email as a weapon to trick the recipient into believing they are from a trusted source'),
    (deck_id, 'ما هو التصيد الإلكتروني؟', 'هجوم إلكتروني يستخدم رسائل البريد الإلكتروني المقنعة كسلاح لخداع المستقبل للاعتقاد أنها من مصدر موثوق'),
    (deck_id, 'What is Encryption?', 'The process of encoding information in such a way that only authorized parties can access it'),
    (deck_id, 'ما هو التشفير؟', 'عملية ترميز المعلومات بطريقة تجعل الأطراف المخولة فقط قادرة على الوصول إليها'),
    (deck_id, 'What is Two-Factor Authentication (2FA)?', 'An extra layer of security that requires not only a password and username but also something that only the user has on them'),
    (deck_id, 'ما هو التحقق بخطوتين؟', 'طبقة أمان إضافية تتطلب ليس فقط كلمة مرور واسم مستخدم ولكن أيضاً شيئاً يملكه المستخدم فقط')
    ON CONFLICT DO NOTHING;
END $$;

-- إنشاء دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء triggers لتحديث updated_at
CREATE TRIGGER update_decks_updated_at BEFORE UPDATE ON decks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
