/**
 * Password protection utility for delete operations
 * Prevents accidental or unauthorized deletion of decks, cards, and folders
 */

const DELETE_PASSWORD = '123123';

/**
 * Prompts user for password before allowing delete operation
 * @param {string} itemType - Type of item being deleted (e.g., 'deck', 'card', 'folder')
 * @param {string} itemName - Name of the item being deleted (optional, for better UX)
 * @returns {boolean} - True if password is correct, false otherwise
 */
export const confirmDeleteWithPassword = (itemType = 'item', itemName = '') => {
    const displayName = itemName ? ` "${itemName}"` : '';
    const message = `⚠️ تحذير: سيتم حذف ${itemType}${displayName}\n\nأدخل كلمة المرور للمتابعة:`;
    
    const userPassword = prompt(message);
    
    if (userPassword === null) {
        // User cancelled
        return false;
    }
    
    if (userPassword === DELETE_PASSWORD) {
        return true;
    }
    
    alert('❌ كلمة المرور غير صحيحة');
    return false;
};

/**
 * Alternative confirmation without password (for non-critical operations)
 * @param {string} message - Confirmation message
 * @returns {boolean}
 */
export const confirmAction = (message) => {
    return window.confirm(message);
};
