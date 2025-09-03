import { createClient } from '@supabase/supabase-js'

// إعدادات Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// التحقق من صحة إعدادات Supabase
const isValidSupabaseConfig = () => {
    return supabaseUrl &&
        supabaseKey &&
        supabaseUrl !== 'YOUR_SUPABASE_URL' &&
        supabaseUrl !== 'your_supabase_project_url' &&
        supabaseKey !== 'YOUR_SUPABASE_ANON_KEY' &&
        supabaseKey !== 'your_supabase_anon_key' &&
        supabaseUrl.startsWith('http')
}

// إنشاء عميل Supabase أو قيمة وهمية
export const supabase = isValidSupabaseConfig()
    ? createClient(supabaseUrl, supabaseKey)
    : null

console.log('🔧 Supabase config status:', isValidSupabaseConfig() ? 'Valid' : 'Invalid - using localStorage fallback')

// التحقق من الاتصال
export const testConnection = async () => {
    if (!supabase) {
        console.log('⚠️ Supabase not configured - using localStorage only')
        return false
    }
    try {
        const { data, error } = await supabase.from('decks').select('count').limit(1)
        if (error) {
            console.log('Supabase connection error:', error.message)
            return false
        }
        console.log('✅ Supabase connected successfully')
        return true
    } catch (error) {
        console.log('Supabase connection failed:', error.message)
        return false
    }
}

// دوال للتعامل مع المجموعات (Decks)
export const deckService = {
    // جلب جميع المجموعات مع البطاقات
    async getAll() {
        if (!supabase) throw new Error('Supabase not configured')
        const { data, error } = await supabase
            .from('decks')
            .select(`
                *,
                cards (*)
            `)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    },

    // إنشاء مجموعة جديدة
    async create(deck) {
        if (!supabase) throw new Error('Supabase not configured')
        const { data, error } = await supabase
            .from('decks')
            .insert([{
                title: deck.title,
                description: deck.description,
                created_at: new Date().toISOString()
            }])
            .select()
            .single()

        if (error) throw error
        return { ...data, cards: [] }
    },

    // تحديث مجموعة
    async update(id, updates) {
        if (!supabase) throw new Error('Supabase not configured')
        const { data, error } = await supabase
            .from('decks')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // حذف مجموعة
    async delete(id) {
        if (!supabase) throw new Error('Supabase not configured')
        const { error } = await supabase
            .from('decks')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    },

    // إعادة تعيين جميع البطاقات في المجموعة كغير معروفة
    async resetDeck(id) {
        if (!supabase) throw new Error('Supabase not configured')
        const { error } = await supabase
            .from('cards')
            .update({ known: false, times_seen: 0, times_known: 0 })
            .eq('deck_id', id)

        if (error) throw error

        // إعادة جلب المجموعة المحدثة
        return await this.getById(id)
    },

    // جلب مجموعة واحدة مع البطاقات
    async getById(id) {
        if (!supabase) throw new Error('Supabase not configured')
        const { data, error } = await supabase
            .from('decks')
            .select(`
                *,
                cards (*)
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    }
}

// دوال للتعامل مع البطاقات (Cards)
export const cardService = {
    // إضافة بطاقة جديدة
    async create(deckId, card) {
        if (!supabase) throw new Error('Supabase not configured')
        const { data, error } = await supabase
            .from('cards')
            .insert([{
                deck_id: deckId,
                question: card.question,
                answer: card.answer,
                known: false,
                times_seen: 0,
                times_known: 0,
                created_at: new Date().toISOString()
            }])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // تحديث بطاقة
    async update(id, updates) {
        if (!supabase) throw new Error('Supabase not configured')
        const { data, error } = await supabase
            .from('cards')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // تحديث بطاقة (دالة مشتركة لتحديث المعرف والكارد)
    async updateCard(deckId, cardId, updates) {
        if (!supabase) throw new Error('Supabase not configured')
        const { data, error } = await supabase
            .from('cards')
            .update(updates)
            .eq('id', cardId)
            .eq('deck_id', deckId)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // تبديل حالة "known" للبطاقة
    async toggleKnown(cardId) {
        if (!supabase) throw new Error('Supabase not configured')
        // أولاً نجلب البطاقة الحالية
        const { data: currentCard, error: fetchError } = await supabase
            .from('cards')
            .select('*')
            .eq('id', cardId)
            .single()

        if (fetchError) throw fetchError

        // تحديث الحالة والإحصائيات
        const newKnownState = !currentCard.known
        const updates = {
            known: newKnownState,
            times_seen: currentCard.times_seen + 1,
            last_seen_at: new Date().toISOString()
        }

        // إذا تم وضع علامة "known"، نزيد العداد
        if (newKnownState) {
            updates.times_known = currentCard.times_known + 1
            updates.last_known_at = new Date().toISOString()
        }

        const { data, error } = await supabase
            .from('cards')
            .update(updates)
            .eq('id', cardId)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // حذف بطاقة
    async delete(id) {
        if (!supabase) throw new Error('Supabase not configured')
        const { error } = await supabase
            .from('cards')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    },

    // حذف بطاقة (دالة مشتركة مع معرف المجموعة)
    async deleteCard(deckId, cardId) {
        if (!supabase) throw new Error('Supabase not configured')
        const { error } = await supabase
            .from('cards')
            .delete()
            .eq('id', cardId)
            .eq('deck_id', deckId)

        if (error) throw error
        return true
    },

    // تسجيل مشاهدة البطاقة
    async markAsSeen(cardId) {
        if (!supabase) throw new Error('Supabase not configured')
        const { data, error } = await supabase
            .from('cards')
            .update({
                times_seen: supabase.raw('times_seen + 1'),
                last_seen_at: new Date().toISOString()
            })
            .eq('id', cardId)
            .select()
            .single()

        if (error) throw error
        return data
    }
}
